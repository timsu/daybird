defmodule SequenceWeb.AuthController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{Auth, Auth.OAuth, Teams, Invites, Projects, Users, Users.User, Utils}

  action_fallback SequenceWeb.FallbackController

  def sign_in(conn, %{"email" => email, "password" => password }) do
    case Users.authenticate_user(email, password) do
      {:ok, user} ->
        sign_in_success(conn, user)
      {:error, reason} ->
        if !Sequence.test?, do: Process.sleep(2000)
        {:error, :unauthorized, reason}
    end
  end

  def create_account(conn, %{"name" => name, "email" => email, "password" => password } = params) do
    case Users.find_by_email(email) do
      {:ok, user} ->
        case Users.check_password(user, password) do
          {:ok, user} ->
            sign_in_success(conn, user)
          {:error, _reason} ->
            if !Sequence.test?, do: Process.sleep(2000)
            {:error, :unauthorized, "That email is already taken"}
        end
      {:error, :not_found} ->
        user_attrs = %{
          name: name,
          email: email,
          password: password,
          origin_type: params["origin_type"] || "create"
        }
        with {:ok, user} <- Users.create_user(user_attrs) do
          Projects.user_joined(user)
          sign_in_success(conn, user)
        end
    end
  end

  defp sign_in_success(conn, user) do
    token = Auth.gen_token(user)
    conn = Auth.Guardian.Plug.remember_me(conn, user)
    render conn, "token.json", %{token: token, user: user}
  end

  defp attrs_from_google_profile(profile, params) do
    %{
      "name" => profile.name,
      "nickname" => Utils.nickname(profile.name),
      "profile_img" => profile.profile_img,
      "domain" => profile.domain,
    }
    |> Map.merge(Map.get(params, "user") || %{})  # prefer given name/nickname
    |> Map.merge(%{ "google_id" => profile.id, "email" => profile.email })  # prefer fetched google id and email
  end

  defp attrs_from_apple_profile(profile, params) do
    %{
      "name" => params["name"],
      "nickname" => Utils.nickname(params["name"]),
    }
    |> Map.merge(%{ "apple_id" => params["id"], "email" => profile.email })
  end

  def log_in_else_sign_up_oauth(conn, %{"provider" => "google", "token" => token} = params) do
    case find_user_by_google_token(token) do
      {:error, message} -> {:error, :unauthorized, message}

      {:not_found, profile} ->
        allow_sign_up = if Map.has_key?(params, "allow_sign_up"), do: params["allow_sign_up"], else: true
        if allow_sign_up do
          user_attrs = attrs_from_google_profile(profile, params)
          with {:ok, user} <- Users.create_user(user_attrs) do
            Projects.user_joined(user)
            sign_in_success(conn, user)
          end
        else
          {:error, :not_found, %{ msg: "There's no account associated with #{profile.email}.", email: profile.email }}
        end

      {:ok, user} ->
        sign_in_success(conn, user)
    end
  end

  def log_in_else_sign_up_oauth(conn, %{"provider" => "apple", "token" => token} = params) do
    case find_user_by_apple_token(token) do
      {:error, message} -> {:error, :unauthorized, message}
      {:not_found, profile} ->
        allow_sign_up = if Map.has_key?(params, "allow_sign_up"), do: params["allow_sign_up"], else: true
        if allow_sign_up do
          user_attrs = attrs_from_apple_profile(profile, params)
          IO.inspect(profile)
          IO.inspect(user_attrs)
          with {:ok, user} <- Users.create_user(user_attrs) do
            Projects.user_joined(user)
            sign_in_success(conn, user)
          end
        else
          {:error, :not_found, %{ msg: "There's no account associated with #{profile.email}.", email: profile.email }}
        end
      {:ok, user} ->
        sign_in_success(conn, user)
    end
  end

  def log_in_else_sign_up_oauth(_conn, %{"provider" => provider, "token" => _token }),
    do: {:error, :bad_request, "Invalid provider: #{provider}"}

  # POST /join_invite
  # join a team from an invite
  def join_invite(conn, %{"invite" => invite }) do
    with %User{} = user <- Guardian.Plug.current_resource(conn),
         {:ok, invite, team} <- Invites.validate_invite(invite, user) do

      existing =
        if !Teams.is_member?(team, user) do
          Invites.join_team(user, invite, team)
          false
        else
          true
        end

      if user.meta[User.meta_last_team] != team.uuid do
        Users.update_user_meta(user, %{ User.meta_last_team => team.uuid })
      end

      json conn, %{ existing: existing, id: team.uuid }
    end
  end

  # Uses google token to fetch google id/email, then looks up User by google id else google email.
  # If User found via google email (but not google id), then updates google id.
  # Regardless of how User is found, updates profile image.
  #
  # Returns:
  #   {:ok, User} - successful
  #   {:invalid_token} - invalid google token
  #   {:not_found, {id, email, name}} - user not found
  def find_user_by_google_token(token) do
    case OAuth.get_user_info("google", token) do
      {:ok, profile} ->
        case Users.find_by_google_id(profile.id) do
          {:ok, user} ->
            update = profile_picture_update(user, profile)
            if Enum.any?(update) do Users.update_user(user, update) else {:ok, user} end
          _ ->
            case Users.find_by_email(profile.email) do
              {:ok, user} -> Users.update_user(
                user,
                Map.merge(%{ google_id: profile.id }, profile_picture_update(user, profile))
              )
              _ -> {:not_found, profile}
            end
        end
      {:error, message} -> {:error, message}
    end
  end

  def find_user_by_apple_token(token) do
    case OAuth.get_user_info("apple", token) do
      {:ok, profile} ->
        case Users.find_by_email(profile.email) do
          {:ok, user} -> {:ok, user}
          _ -> {:not_found, profile}
        end
      {:error, message} -> {:error, message}
    end
  end

  defp profile_picture_update(user, profile) do
    if not is_nil(profile.profile_img) and (
      is_nil(user.profile_img)
      or (
        String.contains?(user.profile_img, "googleusercontent.com") and profile.profile_img != user.profile_img
      )
    ) do
      %{ profile_img: profile.profile_img }
    else
      %{}
    end
  end

  # GET /user
  # get user information
  def fetch_user(conn, _params) do
    # to avoid double-read of user object, read token directly
    with token <- Guardian.Plug.current_token(conn),
         {:ok, claims} <- Auth.Guardian.decode_and_verify(token),
         {:ok, user} <- Auth.Guardian.resource_from_claims(claims) do

      render conn, "user.json", user: user
    end
  end

  # PUT /user
  # edit user
  def update_user(conn, params) do
    attrs = Enum.reduce(["name", "nickname", "email", "password", "timezone"], %{}, fn(key, acc) ->
      if Map.has_key?(params, key), do: Map.put(acc, Macro.underscore(key), params[key]), else: acc end)

    with %User{} = user <- Guardian.Plug.current_resource(conn),
         user <- Users.get_user!(user.id),
         :ok <- maybe_verify_password(user, params["old_password"], params["password"]) do

      attrs = cond do
        params["meta"] ->
          if params["meta"]["ce"] do
            SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_meta", %{ ce: true })
          end
          Map.put(attrs, "meta", user.meta |> Utils.updated_meta_field(params["meta"]))
        params["clear_meta"] ->
          Map.put(attrs, "meta", nil)
        true ->
          attrs
      end

      with {:ok, user} <- Users.update_user(user, attrs) do
        render conn, "user.json", user: user
      end
    end
  end

  defp maybe_verify_password(_, _, nil), do: :ok

  defp maybe_verify_password(user, old_pw, _) do
    case Users.check_password(user, old_pw) do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :unauthorized, "Sorry, the old password was not correct"}
    end
  end

  # POST /login_success
  # success on polling login
  def login_success(conn, %{ "code" => code } = params) do
    with user <- Guardian.Plug.current_resource(conn) do
      payload = params["payload"]
      token = Auth.gen_token(user)
      SequenceWeb.Endpoint.broadcast("login:#{code}", "token", %{ token: token, payload: payload })
      json conn, %{ success: true }
    end
  end

  # POST /api/v1/exchange_token?fork=true
  def exchange_token(conn, %{"fork" => "true"} = params), do: exchange_token(conn, %{ params | "fork" => true })
  def exchange_token(_conn, %{"token" => nil}), do: {:error, :wrong_token}

  def exchange_token(conn, %{"token" => token, "fork" => true}) do
    with {:ok, user, claims} <- Auth.Guardian.resource_from_token(token),
         {:ok, {refresh, %{ "exp" => refresh_exp }},
               {access, %{ "exp" => access_exp }}, fork} <- do_fork_token(user, token, claims) do

      json(conn, %{ access: %{ token: access, exp: access_exp },
                               refresh: %{ token: refresh, exp: refresh_exp },
                               fork: %{ token: fork }})

    else
      {:error, %ArgumentError{}} ->
        log_failed_token(token)
        {:error, :wrong_token}
      {:error, :token_expired} ->
        {:error, :token_expired}
      any ->
        log_failed_token(token)
        any
    end
  end

  # POST /api/v1/exchange_token
  def exchange_token(conn, %{"token" => token}) do
    with {:ok, user, claims} <- Auth.Guardian.resource_from_token(token),
         {:ok, {refresh, %{ "exp" => refresh_exp }},
               {access, %{ "exp" => access_exp }}} <- do_exchange_token(user, token, claims) do

      json(conn, %{ access: %{ token: access, exp: access_exp },
                    refresh: %{ token: refresh, exp: refresh_exp }})

    else
      {:error, %ArgumentError{}} ->
        log_failed_token(token)
        {:error, :wrong_token}
      {:error, :token_expired} ->
        {:error, :token_expired}
      any ->
        log_failed_token(token)
        any
    end
  end

  defp log_failed_token(token) do
    try do
      claims = Auth.Guardian.peek(token)
      LogDNA.BatchLogger.info("Token exchange failed", claims)
    rescue
      _ -> nil
    end
  end

  defp do_exchange_token(_user, token, %{ "typ" => "refresh" }) do
    with {:ok, _old, access} <- Auth.Guardian.exchange(token, "refresh", "access"),
         {:ok, _old, refresh} <- Auth.Guardian.exchange(token, "refresh", "refresh") do

      {:ok, refresh, access}
    end
  end

  defp do_exchange_token(_user, _token, _claims), do: {:error, :wrong_token}

  defp do_fork_token(user, token, claims) do
    with {:ok, refresh, access} <- do_exchange_token(user, token, claims) do
      {:ok, fork, _claims} = Auth.Guardian.refresh_token(user, claims["sso"], claims["chain"])
      {:ok, refresh, access, fork}
    end
  end

end
