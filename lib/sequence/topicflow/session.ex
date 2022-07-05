defmodule Sequence.Topicflow.Session do
  use GenServer

  alias Sequence.Topicflow.{Registry, Session, Topic, Socket, JsonRpc}
  alias Sequence.Topicflow.System, as: TFSystem

  require Logger

  @max_requests_length 100
  @disconnected_timeout_ms 5_000
  @idle_period 24 * 3_600 * 1_000
  @health_check_period 60 * 1_000

  defstruct user: nil,
            team: nil,
            state_id: nil,
            client_id: nil,
            socket_pid: nil,
            socket_ref: nil,
            requests: [],
            topic_ids_pids_refs: [],
            disconnected_timeout_ref: nil,
            expire_timer_ref: nil,
            pending_topic_set_keys_bulk: %{},
            request_ids_received_at: %{}

  def child_spec(args) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [args]},
      restart: :temporary
    }
  end

  def start_link(sup_args, server_args) do
    user = Keyword.fetch!(server_args, :user)
    # team = Keyword.fetch!(server_args, :team)
    client_id = Keyword.fetch!(server_args, :client_id)

    registry_name = "#{user.id}:#{client_id}"

    GenServer.start_link(__MODULE__, Keyword.merge(sup_args, server_args),
      name: {:via, Registry, registry_name}
    )
  end

  def cast_receive_messages(session_pid, messages) do
    GenServer.cast(session_pid, {:receive_messages, messages})
  end

  def cast_switch_socket(session_pid, user, team, state_id, socket_pid) do
    GenServer.cast(session_pid, {:switch_socket, user, team, state_id, socket_pid})
  end

  def cast_topic_snapshot(session_pid, topic_id, snapshot, epoch) do
    GenServer.cast(session_pid, {:topic_snapshot, topic_id, snapshot, epoch})
  end

  def cast_topic_verify_request(session_pid, topic_id, ref) do
    GenServer.cast(session_pid, {:topic_verify_request, topic_id, ref})
  end

  def cast_topic_diff(session_pid, topic_id, diff) do
    GenServer.cast(session_pid, {:topic_diff, topic_id, diff})
  end

  def cast_reply_acks(session_pid, request_ids) do
    GenServer.cast(session_pid, {:reply_acks, request_ids})
  end

  def cast_reply_errors(session_pid, request_ids, code, message) do
    GenServer.cast(session_pid, {:reply_errors, request_ids, code, message})
  end

  def cast_reply_ack(session_pid, request_id) do
    cast_reply_acks(session_pid, [request_id])
  end

  # Callbacks

  @impl true
  def init(args) do
    user = Keyword.fetch!(args, :user)
    team = Keyword.fetch!(args, :team)
    client_id = Keyword.fetch!(args, :client_id)
    state_id = Keyword.fetch!(args, :state_id)
    socket_pid = Keyword.fetch!(args, :socket_pid)
    socket_ref = Process.monitor(socket_pid)

    session =
      %Session{
        user: user,
        team: team,
        state_id: state_id,
        client_id: client_id,
        socket_pid: socket_pid,
        socket_ref: socket_ref
      }
      |> send_request(JsonRpc.make_request("cold_sync", %{"user_id" => user.uuid}))

    :ok = schedule_health_check()

    Logger.debug("NEW SESSION/SOCKET #{user.id}/#{inspect(socket_pid)}")

    {:ok, session}
  end

  @impl true
  def handle_cast(
        {:switch_socket, user, team, state_id, socket_pid},
        %Session{
          state_id: state_id
        } = session
      ) do
    Logger.debug("WARM SOCKET SWITCH #{inspect(socket_pid)}")

    session =
      %{
        session
        | user: user,
          team: team
      }
      |> switch_socket(socket_pid)
      |> resend_requests()
      |> send_request(JsonRpc.make_request("warm_sync"))
      |> update_implicit_presence(false)

    {:noreply, session}
  end

  def handle_cast(
        {:switch_socket, user, team, state_id, socket_pid},
        %Session{topic_ids_pids_refs: topic_ids_pids_refs} = session
      ) do
    Logger.debug("COLD SOCKET SWITCH #{inspect(socket_pid)}")

    :ok =
      Enum.each(topic_ids_pids_refs, fn {_, topic_pid, topic_ref} ->
        :ok = Topic.cast_unsubscribe(topic_pid, self())
        true = Process.demonitor(topic_ref)
      end)

    session =
      session
      |> switch_socket(socket_pid)
      |> send_request(JsonRpc.make_request("cold_sync", %{"user_id" => user.uuid}))
      |> clear_implicit_presence()

    {:noreply,
     %{
       session
       | user: user,
         team: team,
         state_id: state_id,
         requests: [],
         topic_ids_pids_refs: []
     }}
  end

  def handle_cast({:receive_messages, messages}, session) do
    session = receive_message_at(session, messages)

    {:noreply,
     handle_pending_topic_set_keys_bulk(
       Enum.reduce(
         messages,
         session,
         &handle_message(
           handle_pending_topic_set_keys_bulk(&2, &1),
           &1
         )
       ),
       nil
     )}
  end

  def handle_cast({:topic_snapshot, topic_id, snapshot, epoch}, session) do
    session =
      session
      |> send_request(
        JsonRpc.make_request("topic_snapshot", %{
          "id" => topic_id,
          "snapshot" => snapshot,
          "epoch" => epoch
        })
      )
      |> check_requests_to_expire()

    {:noreply, session}
  end

  def handle_cast({:topic_verify_request, topic_id, ref}, session) do
    session =
      session
      |> send_request(
        JsonRpc.make_request("topic_verify_request", %{
          "id" => topic_id,
          "ref" => ref
        })
      )
      |> check_requests_to_expire()

    {:noreply, session}
  end

  def handle_cast({:topic_diff, topic_id, diff}, session) do
    session =
      session
      |> send_request(JsonRpc.make_request("topic_diff", %{"id" => topic_id, "diff" => diff}))
      |> check_requests_to_expire()

    {:noreply, session}
  end

  def handle_cast({:reply_acks, request_ids}, session) do
    session =
      session
      |> send_replies(Enum.map(request_ids, &JsonRpc.make_success(&1)))

    {:noreply, session}
  end

  def handle_cast({:reply_errors, request_ids, code, message}, session) do
    session =
      session
      |> send_error_replies(request_ids, code, message)

    {:noreply, session}
  end

  @impl true
  def handle_info(
        {:DOWN, _, :process, down_socket_pid, _},
        %Session{socket_pid: down_socket_pid} = session
      ) do
    Logger.debug("SOCKET DOWN #{inspect(down_socket_pid)} #{inspect(session)}")

    ref = Process.send_after(self(), :disconnected, @disconnected_timeout_ms)

    session =
      %{session | socket_pid: nil, socket_ref: nil, disconnected_timeout_ref: ref}
      |> schedule_expire()

    {:noreply, session}
  end

  def handle_info(
        {:DOWN, _, :process, down_topic_pid, _},
        %Session{topic_ids_pids_refs: topic_ids_pids_refs} = session
      ) do
    if Enum.any?(topic_ids_pids_refs, fn {_, topic_pid, _} -> down_topic_pid == topic_pid end) do
      Logger.debug("TOPIC DOWN #{inspect(down_topic_pid)}")

      {:stop, {:shutdown, :topic_down}, session}
    else
      {:noreply, session}
    end
  end

  def handle_info(:disconnected, session) do
    Logger.debug("SESSION DISCONNECTED #{inspect(self())}")

    session =
      session
      |> update_implicit_presence()

    {:noreply, session}
  end

  def handle_info(:expire, session) do
    Logger.debug("SESSION EXPIRED #{inspect(self())}")

    session =
      session
      |> clear_implicit_presence()

    {:stop, {:shutdown, :expired}, session}
  end

  def handle_info(:health_check, %Session{ topic_ids_pids_refs: topic_refs } = session) do
    :ok = schedule_health_check()

    num_dead = topic_refs
    |> Enum.reject(fn {topic_id, topic_pid, _} -> topic_pid == Registry.whereis_name(topic_id) end)
    |> Enum.count()

    if num_dead > 0 do
      Logger.warn("HEALTH CHECK FAILED #{inspect(self())}")

      {:stop, {:shutdown, :topic_down}, session}
    else
      {:noreply, session}
    end
  end

  defp ack(%Session{requests: requests} = session, reply_id) do
    {acked, non_acked} =
      Enum.split_with(requests, fn %JsonRpc.Request{id: request_id} ->
        request_id == reply_id
      end)

    request =
      case acked do
        [request] -> request
        _ -> nil
      end

    {:ok, request, %{session | requests: non_acked}}
  end

  defp handle_pending_topic_set_keys_bulk(
         session,
         %JsonRpc.Request{method: method}
       )
       when method in ["topic_set_key", "topic_set_presence_key"] do
    session
  end

  defp handle_pending_topic_set_keys_bulk(
         %Session{pending_topic_set_keys_bulk: pending_topic_set_keys_bulk} = session,
         _
       ) do
    session =
      Enum.reduce(pending_topic_set_keys_bulk, session, fn {{topic_id, group},
                                                            {bulk, request_ids}},
                                                           session ->
        case lookup_topic(session, topic_id) do
          {:ok, topic_pid, session} ->
            :ok =
              Topic.cast_set_keys_bulk(
                topic_pid,
                Enum.reverse(request_ids),
                self(),
                group,
                Enum.reverse(bulk)
              )

            session

          {:error, reason} ->
            session
            |> send_error_reason_replies(request_ids, reason)
        end
      end)

    %{session | pending_topic_set_keys_bulk: %{}}
  end

  defp handle_message(session, %JsonRpc.Success{id: reply_id} = reply) do
    {:ok, request, session} = ack(session, reply_id)

    handle_reply(session, request, reply)
  end

  defp handle_message(
         session,
         %JsonRpc.Error{id: error_id, error: %JsonRpc.ErrorInfo{message: message}}
       ) do
    {:ok, request, session} = ack(session, error_id)
    Logger.error("CLIENT ERROR #{message} IN RESPONSE TO #{inspect(request)}")
    session
  end

  defp handle_message(
         session,
         %JsonRpc.Request{id: request_id, method: "topic_subscribe", params: params} = request
       ) do
    case params do
      %{"id" => subscribe_topic_id} ->
        case lookup_topic(session, subscribe_topic_id) do
          {:ok, topic_pid, session} ->

            session = session |> update_implicit_presence(subscribe_topic_id)

            :ok = Topic.cast_subscribe(topic_pid, request_id, self())

            session

          {:error, reason} ->
            session
            |> send_error_reason_reply(request_id, reason)
        end

      _ ->
        send_reply(session, JsonRpc.make_invalid_params_error(request))
    end
  end

  defp handle_message(
         %Session{topic_ids_pids_refs: topic_ids_pids_refs} = session,
         %JsonRpc.Request{method: "topic_unsubscribe", params: params} = request
       ) do
    case params do
      %{"id" => unsubscribe_topic_id} ->
        topic_ids_pids_refs =
          case topic_ids_pids_refs
               |> Enum.split_with(fn {topic_id, _, _} -> topic_id == unsubscribe_topic_id end) do
            {[{_, topic_pid, topic_ref}], topic_ids_pids_refs} ->
              :ok = Topic.cast_unsubscribe(topic_pid, self())
              true = Process.demonitor(topic_ref)

              topic_ids_pids_refs

            {_, topic_ids_pids_refs} ->
              topic_ids_pids_refs
          end

        session = session |> clear_implicit_presence(unsubscribe_topic_id)

        session = %{
          session
          | topic_ids_pids_refs: topic_ids_pids_refs
        }

        send_reply(
          session,
          JsonRpc.make_success(request)
        )

      _ ->
        send_reply(session, JsonRpc.make_invalid_params_error(request))
    end
  end

  defp handle_message(
         %Session{
           user: user,
           client_id: client_id,
           pending_topic_set_keys_bulk: pending_topic_set_keys_bulk
         } = session,
         %JsonRpc.Request{id: request_id, method: method, params: params} = request
       )
       when method in ["topic_set_key", "topic_set_presence_key"] do
    case params do
      %{
        "id" => set_topic_id,
        "key" => key,
        "ts" => ts
      } ->
        value = Map.get(params, "value")
        if Topic.valid_settable_key_prefix?(key) do
          group =
            case method do
              "topic_set_presence_key" -> TFSystem.presence_group(user, client_id)
              _ -> nil
            end

          ttl = Map.get(params, "ttl")

          session = session |> update_implicit_presence(set_topic_id)

          bulk_key = {set_topic_id, group}
          {bulk, request_ids} = Map.get(pending_topic_set_keys_bulk, bulk_key, {[], []})

          pending_topic_set_keys_bulk =
            Map.put(
              pending_topic_set_keys_bulk,
              bulk_key,
              {[{key, {value, ttl}, ts} | bulk], [request_id | request_ids]}
            )

          %{session | pending_topic_set_keys_bulk: pending_topic_set_keys_bulk}
        else
          send_reply(session, JsonRpc.make_invalid_params_error(request))
        end

      _ ->
        send_reply(session, JsonRpc.make_invalid_params_error(request))
    end
  end

  defp handle_message(
         %Session{ pending_topic_set_keys_bulk: pending_topic_set_keys_bulk } = session,
         %JsonRpc.Request{id: request_id, method: "topic_atomic_add", params: params} = request
       ) do
    case params do
      %{
        "id" => set_topic_id,
        "key" => key,
        "ts" => ts,
        "value" => value,
        "at" => at
      } ->
        if Topic.valid_settable_key_prefix?(key) do
          group = nil

          ttl = Map.get(params, "ttl")

          bulk_key = {set_topic_id, group}
          {bulk, request_ids} = Map.get(pending_topic_set_keys_bulk, bulk_key, {[], []})

          pending_topic_set_keys_bulk =
            Map.put(
              pending_topic_set_keys_bulk,
              bulk_key,
              {[{key, {:add, {value, at}, ttl}, ts} | bulk], [request_id | request_ids]}
            )

          %{session | pending_topic_set_keys_bulk: pending_topic_set_keys_bulk}
        else
          send_reply(session, JsonRpc.make_invalid_params_error(request))
        end

      _ ->
        send_reply(session, JsonRpc.make_invalid_params_error(request))
    end
  end

  defp handle_message(
         %Session{ pending_topic_set_keys_bulk: pending_topic_set_keys_bulk } = session,
         %JsonRpc.Request{id: request_id, method: "topic_atomic_subtract", params: params} = request
       ) do
    case params do
      %{
        "id" => set_topic_id,
        "key" => key,
        "ts" => ts,
      } ->
        value = params["value"]
        at = params["at"]
        if Topic.valid_settable_key_prefix?(key) do
          group = nil

          ttl = Map.get(params, "ttl")

          bulk_key = {set_topic_id, group}
          {bulk, request_ids} = Map.get(pending_topic_set_keys_bulk, bulk_key, {[], []})

          pending_topic_set_keys_bulk =
            Map.put(
              pending_topic_set_keys_bulk,
              bulk_key,
              {[{key, {:subtract, {value, at}, ttl}, ts} | bulk], [request_id | request_ids]}
            )

          %{session | pending_topic_set_keys_bulk: pending_topic_set_keys_bulk}
        else
          send_reply(session, JsonRpc.make_invalid_params_error(request))
        end

      _ ->
        send_reply(session, JsonRpc.make_invalid_params_error(request))
    end
  end

  defp handle_message(
         %Session{user: user, client_id: client_id, topic_ids_pids_refs: topic_ids_pids_refs} =
           session,
         %JsonRpc.Request{id: request_id, method: method, params: params} = request
       )
       when method in ["topic_clear_prefix", "topic_clear_presence_prefix"] do
    case params do
      %{
        "id" => set_topic_id,
        "prefix" => prefix,
        "ts" => ts
      } ->
        if Topic.valid_settable_key_prefix?(prefix) do
          case Enum.find(topic_ids_pids_refs, nil, fn {topic_id, _, _} ->
                 set_topic_id == topic_id
               end) do
            {_, topic_pid, _} ->
              {group, except_keys} =
                case method do
                  "topic_clear_presence_prefix" ->
                    {TFSystem.presence_group(user, client_id), TFSystem.presence_keys()}

                  _ ->
                    {nil, []}
                end

              :ok =
                Topic.cast_clear_keys(
                  topic_pid,
                  request_id,
                  self(),
                  group,
                  prefix,
                  except_keys,
                  ts
                )

              session

            nil ->
              send_reply(session, JsonRpc.make_invalid_params_error(request))
          end
        else
          send_reply(session, JsonRpc.make_invalid_params_error(request))
        end

      _ ->
        send_reply(session, JsonRpc.make_invalid_params_error(request))
    end
  end

  defp handle_message(
         %Session{topic_ids_pids_refs: topic_ids_pids_refs, client_id: client_id, user: user} =
           session,
         %JsonRpc.Request{method: "topic_verify_reply", params: params} = request
       ) do
    case params do
      %{"id" => verify_topic_id, "ref" => verify_ref, "snapshot" => verify_snapshot} ->
        case Enum.find(topic_ids_pids_refs, nil, fn {topic_id, _, _} ->
               verify_topic_id == topic_id
             end) do
          {_, topic_pid, _} ->
            :ok =
              Topic.cast_topic_verify_reply(
                topic_pid,
                verify_ref,
                verify_snapshot,
                client_id,
                user.id
              )

            send_reply(
              session,
              JsonRpc.make_success(request)
            )

          nil ->
            send_reply(session, JsonRpc.make_invalid_params_error(request))
        end

      _ ->
        send_reply(session, JsonRpc.make_invalid_params_error(request))
    end
  end

  defp handle_message(session, %JsonRpc.Request{} = request) do
    send_reply(session, JsonRpc.make_method_not_found_error(request))
  end

  defp handle_reply(session, _, _) do
    session
  end

  defp send_request(session, request, max_wait \\ nil)

  defp send_request(
         %Session{socket_pid: nil, requests: requests} = session,
         %JsonRpc.Request{} = request,
         _max_wait
       ) do
    %Session{session | requests: compress_requests([request | requests])}
  end

  defp send_request(
         %Session{requests: requests} = session,
         %JsonRpc.Request{} = request,
         max_wait
       ) do
    session = send_messages(session, [request], max_wait)

    %Session{session | requests: [request | requests]}
  end

  defp check_requests_to_expire(%Session{requests: requests} = session) do
    if length(requests) > @max_requests_length do
      _ = send(self(), :expire)
    end

    session
  end

  defp send_reply(session, reply, max_wait \\ nil) do
    send_replies(session, [reply], max_wait)
  end

  defp send_replies(session, replies, max_wait \\ nil) do
    send_messages(session, replies, max_wait)
  end

  defp send_error_replies(session, request_ids, code, message, max_wait \\ nil) do
    session
    |> send_replies(Enum.map(request_ids, &JsonRpc.make_error(&1, code, message)), max_wait)
  end

  defp send_error_reason_reply(session, request_id, reason, max_wait \\ nil) do
    session
    |> send_error_reason_replies([request_id], reason, max_wait)
  end

  defp send_error_reason_replies(session, request_ids, reason, max_wait \\ nil) do
    session
    |> send_error_replies(request_ids, 4100, inspect(reason), max_wait)
  end

  defp resend_requests(%Session{requests: requests} = session, max_wait \\ nil) do
    compressed_requests = compress_requests(requests)
    session = send_messages(session, Enum.reverse(compressed_requests), max_wait)
    %{session | requests: compressed_requests}
  end

  defp send_messages(%Session{socket_pid: nil} = session, _, _) do
    session
  end

  defp send_messages(%Session{socket_pid: socket_pid} = session, messages, max_wait) do
    {:ok, session, messages} = send_messages_at(session, messages)

    :ok = Socket.send_messages(socket_pid, messages, max_wait)
    session
  end

  defp compress_requests(requests) do
    # Most recent request comes first
    {diff_and_snapshot_requests, _} =
      requests
      |> Enum.split_with(fn
        %JsonRpc.Request{method: method} when method in ["topic_diff", "topic_snapshot"] -> true
        _ -> false
      end)

    diff_and_snapshot_requests
    |> Enum.group_by(fn %JsonRpc.Request{params: %{"id" => topic_id}} -> topic_id end)
    |> Enum.map(fn
      {_, [request]} ->
        # Either diff or snapshot--keep as is
        [request]

      {_,
       [
         %JsonRpc.Request{method: "topic_diff"} = diff_request,
         %JsonRpc.Request{method: "topic_snapshot"} = snapshot_request
       ]} ->
        # Snapshot followed by diff--keep as is
        [diff_request, snapshot_request]

      {topic_id, diff_and_snapshot_requests} ->
        {compressed_snapshot_and_epoch, compressed_diff} =
          diff_and_snapshot_requests
          |> Enum.reverse()
          # Most recent request now comes last
          |> Enum.reduce({nil, %{}}, fn
            # Compress by merging diffs
            %JsonRpc.Request{params: %{"diff" => diff}},
            {compressed_snapshot_and_epoch, compressed_diff} ->
              {compressed_snapshot_and_epoch, Map.merge(compressed_diff, diff)}

            # Keep most recent snapshot and reset compressed diff
            %JsonRpc.Request{params: %{"snapshot" => snapshot, "epoch" => epoch}}, _ ->
              {{snapshot, epoch}, %{}}
          end)

        # Compressed snapshot followed by compressed diff
        if compressed_diff != %{} do
          [JsonRpc.make_request("topic_diff", %{"id" => topic_id, "diff" => compressed_diff})]
        else
          []
        end ++
          case compressed_snapshot_and_epoch do
            nil ->
              []

            {snapshot, epoch} ->
              [
                JsonRpc.make_request("topic_snapshot", %{
                  "id" => topic_id,
                  "snapshot" => snapshot,
                  "epoch" => epoch
                })
              ]
          end
    end)
    |> Enum.concat()
  end

  defp status_value(nil), do: "disconnected"
  defp status_value(_), do: "connected"

  defp user_info(user) do
    %{
      "name" => user.name,
      "nickname" => user.nickname,
      "email" => user.email,
      "profile_image" => user.profile_img
    }
  end

  defp team_info(team) do
    {org_id, org_name} =
      if team.org_id do
        {team.org.uuid, team.org.name}
      else
        {nil, nil}
      end

    %{
      "id" => team.uuid,
      "name" => team.name,
      "org_id" => org_id,
      "org_name" => org_name
    }
  end

  defp update_implicit_presence(
         %Session{
           topic_ids_pids_refs: topic_ids_pids_refs,
           user: user,
           team: team,
           client_id: client_id,
           socket_pid: socket_pid
         } = session,
         only_topic_id \\ nil
       ) do
    :ok =
      Enum.each(topic_ids_pids_refs, fn {topic_id, topic_pid, _} ->

        if TFSystem.send_presence(topic_id) && (is_nil(only_topic_id) or only_topic_id == topic_id) do
          value = %{
            TFSystem.user_info_key() => {user_info(user), nil},
            TFSystem.status_key() => {status_value(socket_pid), nil},
          }

          value =
            if team do
              Map.merge(value, %{
                TFSystem.team_info_key() => {team_info(team), nil}
              })
            else
              value
            end

          :ok =
            Topic.cast_set_keys_no_reply(
              topic_pid,
              TFSystem.presence_group(user, client_id),
              value
            )
        end
      end)

    session
  end

  defp clear_implicit_presence(
         %Session{
           topic_ids_pids_refs: topic_ids_pids_refs,
           user: user,
           client_id: client_id
         } = session,
         only_topic_id \\ nil
       ) do
    :ok =
      Enum.each(topic_ids_pids_refs, fn {topic_id, topic_pid, _} ->
        if is_nil(only_topic_id) or only_topic_id == topic_id do
          :ok =
            Topic.cast_set_keys_no_reply(
              topic_pid,
              TFSystem.presence_group(user, client_id),
              TFSystem.presence_keys() |> Enum.map(&{&1, {nil, nil}}) |> Map.new()
            )
        end
      end)

    session
  end

  defp switch_socket(
         %Session{
           socket_pid: prev_socket_pid,
           socket_ref: prev_socket_ref,
           disconnected_timeout_ref: disconnected_timeout_ref
         } = session,
         socket_pid
       ) do
    if disconnected_timeout_ref != nil do
      _ = Process.cancel_timer(disconnected_timeout_ref)
    end

    if prev_socket_pid != nil do
      :ok = Socket.switch_out(prev_socket_pid)
    end

    if prev_socket_ref != nil do
      _ = Process.demonitor(prev_socket_ref, [:flush])
    end

    socket_ref = Process.monitor(socket_pid)

    %{
      session
      | socket_pid: socket_pid,
        socket_ref: socket_ref,
        disconnected_timeout_ref: nil
    }
    |> cancel_expire()
  end

  defp schedule_expire(%Session{} = session) do
    %{session | expire_timer_ref: Process.send_after(self(), :expire, @idle_period)}
  end

  defp cancel_expire(%Session{expire_timer_ref: nil} = session) do
    session
  end

  defp cancel_expire(%Session{expire_timer_ref: expire_timer_ref} = session) do
    _ = Process.cancel_timer(expire_timer_ref)
    %{session | expire_timer_ref: nil}
  end

  defp lookup_topic(%Session{topic_ids_pids_refs: topic_ids_pids_refs} = session, lookup_topic_id) do
    case Enum.find(topic_ids_pids_refs, fn {topic_id, topic_pid, _} ->
           topic_id == lookup_topic_id && Registry.whereis_name(topic_id) == topic_pid
         end) do
      {_, topic_pid, _} ->
        {:ok, topic_pid, session}

      nil ->
        case Topic.Supervisor.start_child(lookup_topic_id) do
          {:ok, topic_pid} ->
            {:ok, topic_pid, swap_topic_pid(session, lookup_topic_id, topic_pid)}

          {:error, {:already_started, topic_pid}} ->
            {:ok, topic_pid, swap_topic_pid(session, lookup_topic_id, topic_pid)}

          error ->
            error
        end
    end
  end

  defp swap_topic_pid(
        %Session{topic_ids_pids_refs: topic_ids_pids_refs} = session,
        lookup_topic_id,
        topic_pid
      ) do

    topic_ids_pids_refs = Enum.reject(
      topic_ids_pids_refs,
      fn {topic_id, _, _} -> topic_id == lookup_topic_id end
    )

    ref = Process.monitor(topic_pid)
    %{ session | topic_ids_pids_refs: [ {lookup_topic_id, topic_pid, ref} | topic_ids_pids_refs] }
  end

  defp now do
    :os.system_time(:microsecond)
  end

  defp receive_message_at(
         session,
         messages
       ) do
    now = now()

    Enum.reduce(messages, session, fn
      %JsonRpc.Request{id: request_id},
      %Session{request_ids_received_at: request_ids_received_at} = session ->
        %{session | request_ids_received_at: Map.put(request_ids_received_at, request_id, now)}

      _, session ->
        session
    end)
  end

  defp send_messages_at(session, messages) do
    now = now()

    reducer = fn
      %{id: reply_id, __struct__: struct} = reply,
      {%Session{request_ids_received_at: request_ids_received_at} = session, messages}
      when struct in [JsonRpc.Success, JsonRpc.Error] ->
        {at, request_ids_received_at} = Map.pop(request_ids_received_at, reply_id)

        reply =
          if at != nil do
            elapsed = now - at

            JsonRpc.set_reply_meta(reply, elapsed)
          else
            reply
          end

        {%{session | request_ids_received_at: request_ids_received_at}, [reply | messages]}

      message, {session, messages} ->
        {session, [message | messages]}
    end

    {session, messages} = Enum.reduce(messages, {session, []}, reducer)

    {:ok, session, Enum.reverse(messages)}
  end

  defp schedule_health_check() do
    period = floor(@health_check_period * (:rand.uniform() + 1.0))
    _ = Process.send_after(self(), :health_check, period)
    :ok
  end
end
