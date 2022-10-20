defmodule SequenceWeb.OAuthController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{OAuthTokens, Google, Utils}

  action_fallback SequenceWeb.FallbackController

  # GET /oauth/token
  def get_service_token(conn, %{ "service" => service }) do
    user = Guardian.Plug.current_resource(conn)
    token = OAuthTokens.find_for_user(user, service)

    render conn, "token.json", token: token
  end

  # DELETE /oauth/token
  def delete_service_token(conn, %{ "service" => service }) do
    user = Guardian.Plug.current_resource(conn)
    token = OAuthTokens.find_for_user(user, service)

    if token do
      OAuthTokens.soft_delete_oauth_token(token)
    end

    json conn, %{ success: true }
  end

  # GET /oauth/connect
  def connect_service(conn, %{ "service" => service, "code" => code, "redirect_uri" => redirect_uri }) do
    user = Guardian.Plug.current_resource(conn)
    with {:ok, result} <- OAuthTokens.get_service(service).exchange_code_for_token(code, redirect_uri) do
      new_params = %{"service" => service}
      {:ok, token} = save_oauth_token(user, Map.merge(result, new_params))
      render conn, "token.json", token: token
    else
      {:error, :spotify, _status, error} ->
        {:error, :bad_request, "Login error: #{error}"}
      {:error, :google, _status, error} ->
        {:error, :bad_request, "Login error: #{error}"}
    end
  end

  # GET /oauth/exchange
  #
  # Exchange a code for access/refresh tokens but do not save them.
  def exchange_token(conn, %{ "service" => service, "code" => code, "redirect_uri" => redirect_uri }) do
    case OAuthTokens.get_service(service).exchange_code_for_token(code, redirect_uri) do
      {:ok, result} ->
        token = %{
          access: result["access_token"],
          name: service,
          expires_at: Timex.now |> Timex.shift(seconds: result["expires_in"]),
          meta: %{}
        }
        render conn, "token.json", token: token
      {:error, :spotify, _status, error} ->
        {:error, :bad_request, "Login error: #{error}"}
      {:error, :google, _status, error} ->
        {:error, :bad_request, "Login error: #{error}"}
    end
  end

  defp save_oauth_token(user, params)
  defp save_oauth_token(user, %{ "access_token" => access_token, "refresh_token" => refresh_token } = params) do
    params = params
    |> Map.delete("access_token")
    |> Map.delete("refresh_token")
    |> Map.put("access", access_token)
    |> Map.put("refresh", refresh_token)

    save_oauth_token(user, params)
  end

  defp save_oauth_token(user, %{ "service" => service, "access" => access, "refresh" => refresh,
      "expires_in" => expires_in }) do
    expires_at = Timex.shift(Timex.now, seconds: expires_in)

    attrs = %{
      user_id: user.id,
      name: service,
      access: access,
      refresh: refresh,
      expires_at: expires_at,
      synced_at: nil,
      deleted_at: nil
    }

    OAuthTokens.update_or_create_for_user_and_service(user, service, attrs)
  end

  # PUT /oauth/token
  def update_service_token(conn, %{ "service" => service } = params) do
    user = Guardian.Plug.current_resource(conn)

    {:ok, token} = case OAuthTokens.find_for_user(user, service) do
      nil ->
        save_oauth_token(user, params)

      token ->
        attrs = Map.take(params, ["access", "refresh", "expires_at"])
        meta = token.meta || %{}

        meta = if attrs["access"] && meta["invalid_grant"] do
          Map.put(meta, "invalid_grant", false)
        else
          meta
        end

        meta = if params["meta"] do
          Utils.updated_meta_field(meta, params["meta"])
        else
          meta
        end

        attrs = attrs
        |> Map.put("meta", meta)

        result = OAuthTokens.update_oauth_token(token, attrs)
        result
    end
    render conn, "token.json", token: token
  end

  # POST /oauth/refresh
  def refresh_service_token(conn, %{ "service" => service }) do
    user = Guardian.Plug.current_resource(conn)

    case OAuthTokens.find_for_user(user, service) do
      nil ->
        json conn, %{ token: nil }
      token ->
        with {:ok, token} <- OAuthTokens.refresh(token) do
          put_view(conn, SequenceWeb.OAuthView)
          |> render("token.json", token: token)
        else
          {:error, _, 400, reason} ->
            # spotify grant expired
            OAuthTokens.update_oauth_token(token, %{
              deleted_at: Timex.now
            })
            put_status(conn, 400)
            |> json(%{ error: reason, refreshRejected: true })
          {:skip, token} ->
            # google grant revoked or expired
            OAuthTokens.update_oauth_token(token, %{
              deleted_at: Timex.now
            })
            put_status(conn, 400)
            |> json(%{ error: "Invalid Grant", refreshRejected: true })
          {:error, _, _, reason} ->
            # some other kind of error happened
            put_status(conn, 410)
            |> json(%{ error: reason })
        end
    end
  end

  # GET /oauth/google
  def google_oauth(conn, %{ "code" => code } = params) do
    stored_state = conn.cookies["state"]
    origin = get_origin_uri(conn)

    cond do
      stored_state != params["state"] ->
        render conn, "google_oauth.html", error: "State does not match", origin: origin

      String.starts_with?(stored_state || "", "skip-") ->
        json_result = Poison.encode!(%{ code: code })
        render conn, "google_oauth.html", result: json_result, origin: origin

      true ->
        # exchange code for token
        redirect_uri = get_redirect_uri(conn)
        with {:ok, result} <- Google.exchange_code_for_token(code, redirect_uri) do
          json_result = Poison.encode!(result)
          render conn, "google_oauth.html", result: json_result, origin: origin
        else
          {:error, :google, status, error} ->
            LogDNA.BatchLogger.error("Google OAuth error: #{status} #{error}")
            render conn, "google_oauth.html", error: Kernel.inspect(error), origin: origin
        end
    end
  end

  def google_oauth(conn, %{ "error" => error }) do
    origin = get_origin_uri(conn)
    render conn, "google_oauth.html", error: error, origin: origin
  end

  def google_oauth(conn, params) do
    state = if(params["skip_token"], do: "skip-", else: "") <> Utils.random_string(16)
    conn = put_resp_cookie(conn, "state", state, max_age: 3600)
    redirect_uri = get_redirect_uri(conn)

    scope = params["scope"] || "profile email"
    prompt = if params["scope"], do: "consent", else: "select_account"
    access_type = if params["scope"], do: "offline", else: "online"
    email = params["email"]

    params = %{
      client_id: Application.get_env(:sequence, Sequence.Auth.OAuth)[:google_client_id],
      redirect_uri: redirect_uri,
      response_type: "code",
      scope: scope,
      state: state,
      login_hint: email,
      prompt: prompt,
      access_type: access_type
    }
    |> URI.encode_query()

    url = "https://accounts.google.com/o/oauth2/v2/auth?" <> params
    redirect conn, external: url
  end

  defp get_origin_uri(conn), do:
    if Sequence.dev? or Sequence.test?, do: "#{conn.scheme}://#{conn.host}:#{conn.port}", else: "https://#{conn.host}"

  defp get_redirect_uri(conn), do: get_origin_uri(conn) <> conn.request_path

end
