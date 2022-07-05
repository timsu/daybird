# inspiration: https://stackoverflow.com/questions/56600637/elixir-phoenix-how-to-customize-http-request-log-format
defmodule SequenceWeb.RequestLogger do
  require Logger

  @behaviour Plug

  def init(opts), do: opts

  @skipped_paths [
    "/api/v1/log_events",
    "/api/v1/log_call_events",
    "/app/main",
    "/app/panel",
    "/",
  ]

  @suppressed_params ["path"]

  def should_log_request?(path) do
    path not in @skipped_paths
  end

  def call(conn, _opts) do
    start_time = System.monotonic_time()

    Plug.Conn.register_before_send(conn, fn(conn) ->
      # We don't want passwords etc. being logged
      params = Phoenix.Logger.filter_values(conn.params)
      |> Enum.reject(fn {k, _v} ->
        k in @suppressed_params
      end)
      |> Enum.into(%{})
      params_string = inspect(params)

      # Log any important session data eg. logged-in user
      user = Guardian.Plug.current_resource(conn)
      user_string = if user, do: "#{user.id} (#{user.name})", else: "(none)"

      # Note redirect, if any
      redirect = Plug.Conn.get_resp_header(conn, "location")
      redirect_string = if redirect != [], do: " redirected_to=#{redirect}", else: ""

      # Calculate time taken (always in ms for consistency)
      stop_time = System.monotonic_time()
      time_us = System.convert_time_unit(stop_time - start_time, :native, :microsecond)
      time_ms = div(time_us, 100) / 10

      # get remote ip address
      remote_ips = Plug.Conn.get_req_header(conn, "x-forwarded-for")
      remote_ip = List.first(remote_ips)

      metadata = %{
        method: conn.method,
        path: conn.request_path,
        params: params,
        status: conn.status,
        duration: time_ms,
        ip: remote_ip
      }
      metadata = if user, do: Map.merge(metadata, %{
        user_id: user.id,
        user_name: user.name,
        user_uuid: user.uuid,
        team_uuid: Map.get(params, "team"),
      }), else: metadata

      msg = "[#{conn.method} #{conn.request_path}] user=#{user_string} params=#{params_string} "<>
      "status=#{conn.status}#{redirect_string} duration=#{time_ms}ms"

      if should_log_request?(conn.request_path) do
        LogDNA.BatchLogger.info(msg, metadata)
        Logger.log(:info, msg)
      end

      conn
    end)
  end
end
