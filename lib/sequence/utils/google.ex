defmodule Sequence.Google do

  require Logger

  # {
  #   "access_token": "NgCXRK...MzYjw",
  #   "token_type": "Bearer",
  #   "scope": "user-read-private user-read-email",
  #   "expires_in": 3600,
  #   "refresh_token": "NgAagA...Um_SHo"
  # }
  def exchange_code_for_token(code, redirect_uri) do
    [
      google_client_id: client_id,
      google_client_secret: client_secret,
    ] = configs()
    params = [client_id: client_id, client_secret: client_secret, grant_type: "authorization_code",
      code: code, redirect_uri: redirect_uri]
    post("https://oauth2.googleapis.com/token", std_headers(), params)
  end

  def add_profile_email(payload) do
    %{ "id_token" => token } = payload
    {:ok, profile} = Sequence.Auth.OAuth.get_user_info("google", token)
    Map.put(payload, "email", profile.email)
  end

  # {
  #   "access_token": "NgCXRK...MzYjw",
  #   "token_type": "Bearer",
  #   "scope": "user-read-private user-read-email",
  #   "expires_in": 3600,
  # }
  def refresh_token(refresh_token) do
    [
      google_client_id: client_id,
      google_client_secret: client_secret,
    ] = configs()
    params = [client_id: client_id, client_secret: client_secret, grant_type: "refresh_token", refresh_token: refresh_token]
    post("https://www.googleapis.com/oauth2/v4/token", std_headers(), params)
  end

  def fetch_calendar_events(token, calendar_id, params) do
    get("https://www.googleapis.com/calendar/v3/calendars/#{calendar_id}/events", token_header(token), params)
  end

  def fetch_calendar_events_paginated(token, calendar_id, params) do
    paginate(&fetch_calendar_events(token, calendar_id, &1), params)
  end

  def list_calendars(token, params) do
    get("https://www.googleapis.com/calendar/v3/users/me/calendarList", token_header(token), params)
  end

  def list_calendars_paginated(token, params) do
    paginate(&list_calendars(token, &1), params)
  end

  @two_days 2 * 24 * 60 * 60
  def watch_calendar_events(oauth_token, calendar_id, identifier) do
    params = %{
      "address" => "#{Sequence.base_url()}/meetings/watch",
      "type" => "web_hook",
      "id" => identifier,
      "token" => oauth_token.id,
      "params" => %{ "ttl" => @two_days }
    }
    post_json("https://www.googleapis.com/calendar/v3/calendars/#{calendar_id}/events/watch", token_header(oauth_token.access, "application/json"), params)
  end

  def unwatch_calendar_events(oauth_token, identifier, resource_id) do
    params = %{ "id" => identifier, "resourceId" => resource_id }
    post_json("https://www.googleapis.com/calendar/v3/channels/stop", token_header(oauth_token.access, "application/json"), params)
  end

  def paginate(func, options, items \\ []) do
    case func.(options) do
      {:ok, %{ "nextPageToken" => next_page_token, "items" => new_items }} ->
        paginate(func, Map.put(options, "pageToken", next_page_token), items ++ new_items)
      {:ok, %{ "items" => new_items } = resp} ->
        {:ok, Map.put(resp, "items", items ++ new_items)}
      error -> error
    end
  end

  ###

  def configs, do: Application.get_env(:sequence, Sequence.Auth.OAuth)

  def std_headers(content_type \\ "application/x-www-form-urlencoded") do
    [{"Content-Type", content_type}, {"Accept", "application/json"}]
  end

  def token_header(token, content_type \\ "application/x-www-form-urlencoded") do
    std_headers(content_type) ++ [{"Authorization", "Bearer #{token}"}]
  end

  def oauth_header(id, secret) do
    token = Base.encode64 "#{id}:#{secret}"
    std_headers() ++ [{"Authorization", "Basic #{token}"}]
  end

  defp post(url, headers, params) do
    body = URI.encode_query(params)
    Mojito.post(url, headers, body)
    |> parse_response()
  end

  defp post_json(url, headers, params) do
    body = Jason.encode!(params)
    Mojito.post(url, headers, body)
    |> parse_response()
  end

  defp get(url, headers, params) do
    url
    |> URI.parse()
    |> Map.put(:query, URI.encode_query(params))
    |> URI.to_string()
    |> Mojito.get(headers)
    |> parse_response()
  end

  defp parse_response( {:ok, %Mojito.Response{status_code: 200, body: body}} ) do
    decoded = Poison.decode!(body)
    {:ok, decoded}
  end

  defp parse_response( {:ok, %Mojito.Response{status_code: status, body: body}} ) do
    #if Sequence.dev?, do: IO.puts(body)
    case Jason.decode(body) do
      {:ok, decoded} when is_map(decoded) ->
        if decoded["error_description"], do: Logger.error("Google got error_description: #{inspect(decoded)}")
        {:error, :google, status, decoded["error"]}
      _ -> {:error, :google, status, body}
    end
  end

  defp parse_response( {:error, %Mojito.Error{message: message, reason: reason}} ) do
      message = message || (inspect(reason) |> String.replace("\"", ""))
      {:error, :google, :connection_error, message}
  end

end
