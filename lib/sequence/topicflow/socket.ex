defmodule Sequence.Topicflow.Socket do
  @moduledoc false

  @behaviour :cowboy_websocket

  alias Sequence.Topicflow.{Socket, JsonRpc, Session}
  alias Sequence.{Repo, Teams, Auth }

  require Logger

  @default_ping_deadline_grace_ms 10_000
  @default_ping_roundtrip_timeout_ms 10_000
  @default_ping_period_ms 5_000
  @default_max_wait_ms 20

  @min_max_ping_roundtrip_ms 5

  @ping_roundtrips_max 30
  @ping_min_std_ms_to_periods_ms [{50, 4_000}, {20, 8_000}, {10, 16_000}]

  @ping_timeout_code 1000
  @session_down_code 1000

  @bad_params_code 4000
  @bad_json_code 4001
  @unauthorized_code 4002
  @switched_out_code 4003

  defstruct qs: nil,
            session_pid: nil,
            state_id: nil,
            client_id: nil,
            last_ping_id: nil,
            last_ping_ts_ms: nil,
            ping_timeout_ref: nil,
            ping_roundtrips_ms: [],
            message_buffer: [],
            flush_timer_ref: nil,
            auth_timeout: nil

  def send_messages(socket_pid, messages, max_wait \\ nil)

  def send_messages(_, [], _) do
    :ok
  end

  def send_messages(socket_pid, messages, max_wait) do
    _ = send(socket_pid, {:send_messages, messages, max_wait})
    :ok
  end

  def switch_out(socket_pid) do
    _ = send(socket_pid, :switch_out)
    :ok
  end

  def init(req, _) do
    {:cowboy_websocket, req, %Socket{qs: :cowboy_req.parse_qs(req) |> Map.new()},
     %{idle_timeout: :infinity}}
  end

  def websocket_init(%Socket{qs: qs} = socket) do
    case qs do
      %{"state_id" => state_id, "token" => token, "client_id" => client_id} ->
        case Auth.Guardian.resource_from_partial_token(token) do
          {:ok, user, is_partial} ->
            team_check =
              case Map.get(qs, "team_id") do
                nil ->
                  {:ok, nil}

                team_id ->
                  case Teams.team_by_uuid(user.id, !is_partial && team_id) do
                    {:ok, team} ->
                      {:ok, team |> Repo.preload(:org)}

                    _ ->
                      :unauthorized
                  end
              end

            case team_check do
              {:ok, team} ->
                session_pid =
                  case Session.Supervisor.start_child(user, team, client_id, state_id, self()) do
                    {:error, {:already_started, session_pid}} ->
                      :ok = Session.cast_switch_socket(session_pid, user, team, state_id, self())
                      session_pid

                    {:ok, session_pid} ->
                      session_pid
                  end

                _ = Process.monitor(session_pid)

                {:ok, ping, socket} = issue_ping(socket, true)

                {:ok, %{ "exp" => exp }} = Auth.Guardian.decode_and_verify(token)

                {:reply, {:text, JsonRpc.encode(ping)},
                 %{
                   socket
                   | state_id: state_id,
                     client_id: client_id,
                     session_pid: session_pid,
                     auth_timeout: exp
                 }}

              :unauthorized ->
                {:reply, {:close, @unauthorized_code, "Unauthorized"}, socket}
            end

          _ ->
            {:reply, {:close, @unauthorized_code, "Unauthorized"}, socket}
        end

      _ ->
        {:reply, {:close, @bad_params_code, "Bad params"}, socket}
    end
  end

  def websocket_handle({:text, text}, %Socket{session_pid: session_pid, auth_timeout: exp} = socket) do
    if exp > Timex.to_unix(Timex.now()) do
      case JsonRpc.decode(text) do
        {:ok, messages} ->
          {socket, messages} = Enum.reduce(messages, {socket, []}, &handle_if_ping(&1, &2))
          :ok = Session.cast_receive_messages(session_pid, Enum.reverse(messages))

          {:ok, socket}

        {:error, _} ->
          {:reply, {:close, @bad_json_code, "Bad JSON"}, socket}
      end
    else
      {:reply, {:close, @unauthorized_code, "Unauthorized"}, socket}
    end
  end

  def websocket_handle({:ping, data}, socket) do
    {:reply, {:pong, data}, socket}
  end

  def websocket_info(:ping, socket) do
    {:ok, ping, socket} = issue_ping(socket)
    {:reply, {:text, JsonRpc.encode(ping)}, socket}
  end

  def websocket_info({:ping_timeout, last_ping_id}, %Socket{last_ping_id: last_ping_id} = socket) do
    {:reply, {:close, @ping_timeout_code, "Ping timeout"}, socket}
  end

  def websocket_info({:ping_timeout, _}, socket) do
    {:ok, socket}
  end

  def websocket_info(:switch_out, socket) do
    {:reply, {:close, @switched_out_code, "Socket switched out"}, socket}
  end

  def websocket_info(:flush_buffer, %Socket{message_buffer: _buf} = socket) do
    websocket_info({:send_messages, [], 0}, socket)
  end

  def websocket_info({:send_messages, messages, nil}, socket),
    do: websocket_info({:send_messages, messages, @default_max_wait_ms}, socket)

  def websocket_info(
        {:send_messages, [], 0},
        %Socket{flush_timer_ref: tref, message_buffer: []} = socket
      ) do
    if tref, do: _ = Process.cancel_timer(tref)
    {:ok, %{socket | flush_timer_ref: nil}}
  end

  def websocket_info(
        {:send_messages, messages, 0},
        %Socket{flush_timer_ref: tref, message_buffer: buf} = socket
      ) do
    if tref, do: _ = Process.cancel_timer(tref)
    text = JsonRpc.encode(buf ++ messages)
    {:reply, {:text, text}, %{socket | flush_timer_ref: nil, message_buffer: []}}
  end

  def websocket_info(
        {:send_messages, messages, max_wait},
        %Socket{flush_timer_ref: tref, message_buffer: buf} = socket
      ) when max_wait > 0 do
    tref =
      case tref && Process.read_timer(tref) do
        # If there was no timer set, a new timer
        nil ->
          schedule_flush_buffer(max_wait)

        # If the timer is no longer valid, set a new timer
        false ->
          schedule_flush_buffer(max_wait)

        # If time remaining is smaller than the max wait, just add messages to the buffer and proceed
        # without setting a new timer
        time_left when is_number(time_left) and time_left < max_wait ->
          tref

        # If the time left is greater than max_wait, cancel the existing timer and set a new one
        _ ->
          _ = Process.cancel_timer(tref)
          schedule_flush_buffer(max_wait)
      end

    {:ok, %{socket | message_buffer: buf ++ messages, flush_timer_ref: tref}}
  end

  def websocket_info(
        {:DOWN, _, :process, down_session_pid, _},
        %Socket{session_pid: down_session_pid} = socket
      ) do
    {:reply, {:close, @session_down_code, "Session down"}, socket}
  end

  defp handle_if_ping(
         %JsonRpc.Success{id: last_ping_id},
         {%Socket{
            last_ping_id: last_ping_id,
            last_ping_ts_ms: last_ping_ts_ms,
            ping_timeout_ref: ref,
            ping_roundtrips_ms: roundtrips_ms
          } = socket, messages}
       ) do
    _ = Process.cancel_timer(ref)
    _ = Process.send_after(self(), :ping, ping_period_ms(socket))
    now_ts_ms = :os.system_time(:millisecond)

    roundtrips_ms =
      [now_ts_ms - last_ping_ts_ms | roundtrips_ms] |> Enum.take(@ping_roundtrips_max)

    # IO.inspect(
    #  {ping_deadline_grace_ms(socket), ping_roundtrip_timeout_ms(socket), ping_period_ms(socket)}
    # )

    {%{socket | last_ping_id: nil, last_ping_ts_ms: nil, ping_roundtrips_ms: roundtrips_ms},
     messages}
  end

  defp handle_if_ping(msg, {socket, messages}) do
    {socket, [msg | messages]}
  end

  defp issue_ping(%Socket{} = socket, init \\ false) do
    method =
      if init do
        "init"
      else
        "ping"
      end

    ping =
      JsonRpc.make_request(method, %{
        "next_ping_deadline_ms" => ping_period_ms(socket) + ping_deadline_grace_ms(socket)
      })

    now_ts_ms = :os.system_time(:millisecond)
    ref = Process.send_after(self(), {:ping_timeout, ping.id}, ping_roundtrip_timeout_ms(socket))

    {:ok, ping,
     %{socket | last_ping_id: ping.id, last_ping_ts_ms: now_ts_ms, ping_timeout_ref: ref}}
  end

  defp ping_deadline_grace_ms(%Socket{ping_roundtrips_ms: roundtrips_ms}) do
    if length(roundtrips_ms) == @ping_roundtrips_max do
      max_ms(roundtrips_ms) * 2
    else
      @default_ping_deadline_grace_ms
    end
  end

  defp ping_roundtrip_timeout_ms(%Socket{ping_roundtrips_ms: roundtrips_ms}) do
    if length(roundtrips_ms) == @ping_roundtrips_max do
      max_ms(roundtrips_ms) * 3
    else
      @default_ping_roundtrip_timeout_ms
    end
  end

  defp ping_period_ms(%Socket{ping_roundtrips_ms: roundtrips_ms}) do
    if length(roundtrips_ms) == @ping_roundtrips_max do
      std_ms = std_ms(roundtrips_ms)

      Enum.reduce(@ping_min_std_ms_to_periods_ms, @default_ping_period_ms, fn {min_std_ms,
                                                                               ping_period_ms},
                                                                              acc ->
        if std_ms < min_std_ms do
          ping_period_ms
        else
          acc
        end
      end)
    else
      @default_ping_period_ms
    end
  end

  defp max_ms(mss) do
    max(Enum.max(mss), @min_max_ping_roundtrip_ms)
  end

  defp std_ms(mss) do
    average_ms = Enum.sum(mss) / length(mss)

    :math.sqrt(
      (mss |> Enum.map(fn ms -> :math.pow(ms - average_ms, 2) end) |> Enum.sum()) / length(mss)
    )
  end

  defp schedule_flush_buffer(max_wait) do
    Process.send_after(self(), :flush_buffer, max_wait)
  end
end
