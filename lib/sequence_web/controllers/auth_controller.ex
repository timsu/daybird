defmodule SequenceWeb.AuthController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{Analytics, Auth, Auth.OAuth, Teams, Teams.Team, Teams.UserTeam, Invites, Mailer, Repo,
    Users, Users.User, Utils, Experiments, Orgs, Meetings}
  alias Sequence.Security.RateLimiter
  alias SequenceWeb.Emails

  action_fallback SequenceWeb.FallbackController

  @integration_scopes ["meeting_create", "meeting_update", "meeting_delete"]

  @valid_secrets %{
    "Google Calendar Workspace Add-On" => "3wSvy/hGaVjQE0xIf1X5R4LWXif98atnnE1+Bqsp0rs=",
    "Cal.com" => "29yyYE+y+eVY1M7Y5K5um6sQgxH5m0Cxzh9KIVnxE6Y=",
    "Cal.com Staging" => "ZjQzYmNjMjUtMjI3Ni00N2ZjLWE4YWUtMjExOWQ0NDA1YzVl"
  }

  # POST /log_in_else_sign_up_magic_link
  # log in with email and password or magic link
  def log_in_else_sign_up_magic_link(conn, %{"email" => email, "code" => "demo" } = params) do
    create_params = %{ name: email, email: email, origin_type: params["origin_type"] || "demo" }
    if String.contains?(email, "@demo.com") do
      with {:ok, user, _} <- Users.find_or_create_by_email(email, create_params) do
        team = Teams.find_demo_team()
        if !Teams.is_member?(team, user) do
          _ = Teams.create_user_team(user, team, "member", nil)
        end
        token = Auth.gen_token(user)
        render conn, "token.json", %{token: token, existing: true, team: team, user: user}
      end
    else
      {:error, :unauthorized, "Not a valid demo user" }
    end
  end

  @recording_email "recording@tandem.chat"
  @recording_code "recording123"

  def log_in_else_sign_up_magic_link(conn, %{"email" => @recording_email, "code" => @recording_code} = params) do
    create_params = %{ name: "Tandem Recording", email: @recording_email, origin_type: params["origin_type"] || "recording" }
    with {:ok, user, _} <- Users.find_or_create_by_email(@recording_email, create_params) do
      token = Auth.gen_token(user)
      render conn, "token.json", %{token: token, guest: false, team: nil, user: user}
    end
  end

  # meeting guest flow. generates a special partial token
  def log_in_else_sign_up_magic_link(conn, %{"email" => email, "invite" => "guest-user" } = params) do
    [name, _domain] = String.split(email, "@")
    name = if params["name"] != nil and params["name"] != "", do: params["name"], else: name
    create_params = %{name: name, email: email, origin_type: params["origin_type"] || "guest" }
    with {:ok, user, created} <- Users.find_or_create_by_email(email, create_params) do
      token = Auth.gen_meeting_guest_token(user)
      user = Map.put(user, :meta, %{ "guest" => true })

      # for meeting invites, we pass the meeting code into the code
      if created == :created and params["code"] != nil and params["code"] != "guest-user" do
        meeting_invite = Meetings.find_invite_by_code(params["code"])
        Analytics.create_event("server-event", meeting_invite.user.name, meeting_invite.user.uuid, nil, nil, "joinForInviter", "meeting", user.uuid)
      end
      render conn, "token.json", %{token: token, guest: true, existing: true, team: nil, user: user}
    end
  end

  def log_in_else_sign_up_magic_link(conn, %{"email" => email, "code" => code } = params) when not is_nil(code) do
    allow_sign_up = if Map.has_key?(params, "allow_sign_up"), do: params["allow_sign_up"], else: true
    case Users.magic_link_authenticate(email, code) do
      {:ok, nil} ->
        if allow_sign_up do
          [name, _domain] = String.split(email, "@")
          sign_up_new_user(conn, %{"email" => email, "name" => name}, nil, params["invite"], params)
        else
          {:error, :not_found, %{ msg: "There's no account associated with #{email}.", email: email }}
        end

      {:ok, user} ->
        token = Auth.gen_token(user)
        conn = Auth.Guardian.Plug.remember_me(conn, user)
        render conn, "token.json", %{token: token, existing: true, team: user.primary_team, user: user}
      {:error, reason} ->
        if !Sequence.test?, do: Process.sleep(2000)
        {:error, :unauthorized, reason}
    end
  end

  def log_in_else_sign_up_magic_link(_, %{ "email" => _ }), do: {:error, :bad_request, "No authentication method provided"}

  # POST /magic_link
  # Send magic link for existing users, request additional information
  def magic_link(conn, %{"email" => email} = params) do
    path = params["path"]
    with [_,_] <- String.split(email, "@") do
      r = case Users.find_by_email(email) do
        {:ok, user} ->
          send_magic_link(user, email, path, params["team"])
        _ ->
          send_magic_link(nil, email, path)
      end

      case r do
        :ok ->
          json(conn, %{ success: true })
        {:error, :rate_limit_exceeded} ->
          {:error, :too_many_requests, "Sorry, maximum number of emails have been sent. If you " <>
            "think this is an error please contact support using the (?) button below."}
      end
    else
      _ -> {:error, :unauthorized, "Sorry, that does not appear to be a valid email address."}
    end
  end

  defp send_magic_link(user, email, path, team \\ nil) do
    case check_magic_link_rate_limit(user || email) do
      {:ok, _} ->
        {code, _} = Users.gen_magic_link(user || email)
        Emails.magic_link(email, code, path, team) |> Mailer.deliver_later
        if Sequence.dev?, do: IO.puts("MAGIC LOGIN: #{code}")
        :ok
      {:exceeded, _} ->
        {:error, :rate_limit_exceeded}
    end
  end

  @magic_link_rate_limit_period_ms 24 * 3600 * 1000
  @magic_link_rate_limit 10

  defp check_magic_link_rate_limit(user) when is_map(user) do
    check_magic_link_rate_limit(user.id)
  end

  defp check_magic_link_rate_limit(key) do
    case Sequence.env() do
      "dev" ->
        {:ok, 0}
      "test" ->
        {:ok, 0}
      "staging" ->
        RateLimiter.check_rate_limit("magic_link:user:#{key}", @magic_link_rate_limit_period_ms, 5000)
      _ ->
        RateLimiter.check_rate_limit("magic_link:user:#{key}", @magic_link_rate_limit_period_ms, @magic_link_rate_limit)
    end
  end

  # POST /download_reminder
  # Send a reminder to download Tandem

  def download_reminder(conn, params) do
    with user <- Guardian.Plug.current_resource(conn) do
      ldre = User.meta(user, User.meta_last_download_reminder_email)
      Logger.debug("LDRE: #{ldre}")
      if params["force"] || !ldre || Timex.from_unix(ldre) < Timex.subtract(Timex.now, Timex.Duration.from_days(1))  do
        user = Repo.preload(user, :primary_team)
        Emails.download_reminder(user, user.primary_team) |> Mailer.deliver_later
        Users.update_user_meta(user, User.meta_last_download_reminder_email(Timex.to_unix(Timex.now)))
      else
        Logger.debug("Too soon to send another download email")
      end
      json conn, %{success: true}
    end
  end

  defp sign_up_new_user(conn, user_attrs, team_attrs, meeting_invite, %{ "origin_type" => "meeting" } = params) when is_binary(meeting_invite) do
    case sign_up_new_user(conn, user_attrs, team_attrs, nil, params) do
      {:error, _} = error -> error
      success ->
        meeting_invite = Meetings.find_invite_by_code(meeting_invite)
        Analytics.create_event("server-event", meeting_invite.user.name, meeting_invite.user.uuid, nil, nil, "joinForInviter", "meeting")
        success
    end
  end

  # Assumes user does not exist.  Sign up without team or invite (user will get directed to a page to fix the lack of team)
  defp sign_up_new_user(conn, user_attrs, nil, nil, params) do
    LogDNA.BatchLogger.info("sign_up_new_user #{user_attrs["email"]}", %{ user: user_attrs, team: nil, invite: nil })
    org = Orgs.org_for_email(user_attrs["email"])

    user_attrs = Map.put(user_attrs, "org_id", org && org.id)
    user_attrs = Map.put(user_attrs, "origin_type", params["origin_type"] || "unknown")

    with {:ok, user} <- Users.create_user(user_attrs) do
      token = Auth.gen_token(user, user.google_id != nil)
      Analytics.create_event("server-event", user.name, user.uuid, nil, nil, "newUserSignup")
      Experiments.bucket_new_user(user)
      {:ok, _} = Users.create_funnel_data(%{ user_id: user.id, stages: %{Users.stage_signed_up => Timex.now} })
      Sequence.Workers.StartActivationCampaign.schedule_event(user.uuid)
      render conn, "token.json", existing: false, token: token, user: user, team: nil, no_team: true
    end
  end

  # Assumes that user doesn't already exist.  Sign up with a team and/or an invite
  defp sign_up_new_user(conn, user_attrs, team_attrs, invite, params) do
    LogDNA.BatchLogger.info("sign_up_new_user #{user_attrs["email"]}", %{ user: user_attrs, team: team_attrs, invite: invite })
    org = Orgs.org_for_email(user_attrs["email"])

    transaction = fn invite, team ->
      team_attrs = if team_attrs do
        Map.merge(team_attrs, %{
          "org_id" => if(org, do: org.id),
          "origin_type" => "sign-up"
        })
      end

      existing_team = team != nil
      {:ok, team} = if team, do: {:ok, team}, else:
        Teams.create_team_with_default_rooms(team_attrs)

      invite_id = if invite, do: invite.id
      user_attrs = Map.put(user_attrs, "invite_id", invite_id)
      user_attrs = Map.put(user_attrs, "primary_team_id", team.id)
      user_attrs = Map.put(user_attrs, "org_id", org && org.id)
      user_attrs = if Team.meta(team, Team.meta_default_hear_before_accept) do
        Map.put(user_attrs, "meta", Map.put(%{}, User.meta_hear_before_accept, true ))
      else
        user_attrs
      end
      user_attrs = Map.put(user_attrs, "origin_type",
        case Map.get(params, "origin_type") do
          "meeting" -> "meeting"
          _ -> if(Timex.after?(team.inserted_at, Timex.shift(Timex.now, weeks: -2)), do: "join-new", else: "join-exist")
        end
      )
      {:ok, user} = Users.create_user(user_attrs)

      if !existing_team, do: Teams.update_team(team, %{ creator_id: user.id })

      role = if invite, do: invite.role, else: UserTeam.role_admin
      {:ok, _} = Teams.create_user_team(user, team, role, invite_id)
      Teams.update_team_size_on_join(team, user)

      if invite && team.size <= 10, do: Emails.ping_invite_accepted(invite.user, user.name, user.profile_img) |> Mailer.deliver_later
      if invite, do: Analytics.create_event("server-event", invite.user.name, invite.user.uuid, nil, nil, "joinForInviter", "invite", user.uuid)

      {user, team}
    end

    with {:ok, invite, team} <- get_or_validate_team(invite, team_attrs, user_attrs, org),
         {:ok, {user, team}} <- Repo.transaction(fn -> transaction.(invite, team) end) do

      token = Auth.gen_token(user, user.google_id != nil)
      SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_members", %{})
      Analytics.create_event("server-event", user.name, user.uuid, team.name, team.uuid, "newUserSignup")
      Experiments.bucket_new_user_team(user, team)
      {:ok, _} = Users.create_funnel_data(%{ user_id: user.id, stages: %{Users.stage_signed_up => Timex.now} })
      Sequence.Workers.StartActivationCampaign.schedule_event(user.uuid)
      render conn, "token.json", existing: false, token: token, user: user, team: team
    end
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

  def log_in_else_sign_up_oauth(conn, %{"provider" => "google", "token" => token} = params) do
    invite = Map.get(params, "invite")
    case find_user_by_google_token(token) do
      {:error, message} -> {:error, :unauthorized, message}

      {:not_found, profile} ->
        allow_sign_up = if Map.has_key?(params, "allow_sign_up"), do: params["allow_sign_up"], else: true
        if allow_sign_up do
          team_attrs = Map.get(params, "team")
          user_attrs = attrs_from_google_profile(profile, params)
          sign_up_new_user(conn, user_attrs, team_attrs, invite, params)
        else
          {:error, :not_found, %{ msg: "There's no account associated with #{profile.email}.", email: profile.email }}
        end

      {:ok, user} ->
        if params["origin_type"] != "meeting" do
          with {:ok, invite, team} <- Invites.validate_invite(invite, user) do
            if invite do
              Invites.join_team(user, invite, team)
              if user.primary_team_id != team.id, do: Users.update_user(user, %{ primary_team_id: team.id })
            end
          end
        end

        token = Auth.gen_token(user, true)
        conn = Auth.Guardian.Plug.remember_me(conn, user)
        render conn, "token.json", token: token, user: user, existing: true
    end
  end

  def log_in_else_sign_up_oauth(conn, %{"provider" => "apple", "token" => token}) do
    case find_user_by_apple_token(token) do
      {:error, message} -> {:error, :unauthorized, message}
      {:not_found, profile} ->
        {:error, :not_found, %{ msg: "There's no account associated with #{profile.email}.", email: profile.email }}
      {:ok, user} ->
        token = Auth.gen_token(user, true)
        conn = Auth.Guardian.Plug.remember_me(conn, user)
        render conn, "token.json", token: token, user: user, existing: true
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

  defp get_or_validate_team(invite, team_attrs, _user_attrs, org) do
    cond do
      # user wants to join team given invite. validate invite and fetch team.
      invite != nil -> Invites.validate_invite(invite, org && org.id)

      # user wants to join team with given uuid. make sure user domain matches team domain.
      Map.has_key?(team_attrs, "id") ->
        case Teams.team_by_uuid(team_attrs["id"]) do
          {:ok, team} ->
            cond do
              org == nil -> {:error, :bad_request, "Need user domain to authorize joining team."}
              Team.meta(team, "private") == true -> {:error, :bad_request, "Can't join private team."}
              team.org_id != org.id -> {:error, :bad_request, "Domain mismatch, can't join team."}
              true -> {:ok, nil, team}
            end
          _ -> {:error, :bad_request, "The team uuid #{team_attrs["id"]} doesn't exist"}
        end

      # else user wants to create new team. make sure name is provided
      !Map.has_key?(team_attrs, "name") ->
        {:error, :bad_request, "Must either provide invite or team id to join existing team, or team name to create new team."}

      true -> {:ok, nil, nil}
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
        if Map.has_key?(attrs, "name") or Map.has_key?(attrs, "nickname") or Map.has_key?(attrs, "timezone") do
          Teams.list_user_teams(user)
          |> Enum.each(fn t ->
            SequenceWeb.Endpoint.broadcast("team:#{t.uuid}", "update_members", %{})
          end)
        end

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

  # GET /analyze_email
  # Do some analysis of an email address.  Currently only checks if it's a google domain
  def analyze_email(conn, %{"email" => email}) do
    domain = EmailChecker.Tools.domain_name(email)
    mx = EmailChecker.Tools.lookup(domain)
    google = mx && Regex.match?(~r/google.com\z/i, mx)

    assigns = %{
      domain: domain,
      mx: mx,
      is_google_mx: !!google
    }

    json conn, assigns
  end


  # GET /api/v1/oauth/v2/authorize
  def oauth_authorize(conn, %{ "redirect_uri" => redirect_uri, "state" => state }) do

    with user <- Sequence.Auth.Guardian.current_resource(conn),
        {:ok, token, _claims} <- Sequence.Auth.Guardian.partial_token(user, @integration_scopes) do

      base_uri = URI.parse(redirect_uri)

      query = URI.encode_query(%{ code: token, state: state })

      redirect_url =  Map.put(base_uri, :query, query)
      |> URI.to_string()

       json conn, %{ url: redirect_url }
    end
  end

  # POST /api/v1/gcal/oauth/token OR /api/v1/oauth/v2/token
  def oauth_token(conn, %{ "client_id" => client_id, "client_secret" => client_secret, "refresh_token" => code }) do
    oauth_token(conn, %{ "client_id" => client_id, "client_secret" => client_secret, "code" => code })
  end

  def oauth_token(conn, %{ "client_id" => client_id, "client_secret" => client_secret, "code" => code }) do

    with %{ ^client_id => ^client_secret } <- @valid_secrets,
      {:ok, _old_token, {token, _claims}} <- Sequence.Auth.Guardian.refresh(code, ttl: {52, :week}) do

      expires_in = 86_400 # 1 day

      json conn, %{ refresh_token: token, access_token: token, expires_in: expires_in, token_type: "Bearer" }
    else
      _ -> {:error, :unauthorized}
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
