defmodule Sequence.Auth.Guardian do
  use Guardian, otp_app: :sequence

  use Guardian.Token.Verify

  alias Sequence.{Users, Teams}

  # generate guest token (used when guest user signing in with invite)
  def guest_token(invite) do
    encode_and_sign(nil, %{ guest: true, invite_id: invite.id, team_id: invite.team_id, user_id: invite.user_id })
  end

  # generate full token
  def full_token(user, sso \\ false) do
    encode_and_sign(user, %{ sso: sso })
  end

  def legacy_token(user, sso \\ false) do
    encode_and_sign(user, %{ sso: sso}, ttl: {52, :weeks})
  end

  # generate partial token
  def partial_token(user, scopes) do
    encode_and_sign(user, %{ scopes: scopes }, ttl: {52, :weeks})
  end

  def refresh_token(user, sso, chain \\ nil) do
    chain = chain || UUID.uuid1()
    encode_and_sign(user, %{ sso: sso, chain: chain, interim: true }, ttl: { 5, :minutes}, token_type: "refresh")
  end

  def subject_for_token(user, _claims) do
    if user, do: {:ok, to_string(user.id)}, else: {:ok, nil}
  end

  def resource_from_partial_token(token) do
    with {:ok, claims} <- decode_and_verify(token),
         {:ok, user} <- resource_from_claims(claims, true) do

      # return :ok, user, true if token was partial
      {:ok, user, claims["scopes"] != nil}
    else
      error -> error
    end
  end

  def resource_from_claims(claims, allow_partial \\ false) do
    if System.get_env("DEBUG_TOKENS"), do: IO.inspect(claims)
    scopes = claims["scopes"]
    user_id = claims["sub"]
    user = user_id && Users.get_user(user_id)
    cond do
      scopes != nil and !allow_partial -> {:error, :unauthorized}
      user ->
        {:ok, user}
      true -> {:error, :unauthorized}
    end
  end

  def token_type(claims) do
    if claims["sub"], do: :user, else: :guest
  end

  def user_team_for_guest_token(claims) do
    team_id = claims["team_id"]
    user_id = claims["user_id"]
    {user_id, team_id}
  end

  # checks for a full-scope token
  def current_resource(conn) do
    Guardian.Plug.current_claims(conn)
    Guardian.Plug.current_resource(conn)
  end

  # checks for a partial-scoped token
  def scoped_resource(conn, scope) do
    claims = Guardian.Plug.current_claims(conn)
    allowed = cond do
      claims == nil -> false
      claims["scopes"] == nil -> true
      claims["scopes"] == scope -> true
      is_list(claims["scopes"]) && Enum.member?(claims["scopes"], scope) -> true
      true -> false
    end

    if allowed do
      {:ok, user} = resource_from_claims(claims, true)
      user
    else
      {:error, :unauthorized}
    end
  end

  def current_claims(conn) do
    Guardian.Plug.current_claims(conn)
  end

  def get_user_team(conn, team_id) do
    claims = current_claims(conn)
    case token_type(claims) do
      :user ->
        case resource_from_claims(claims) do
          {:ok, user} ->
            case team_id do
              nil -> {:user, user}
              team_id ->
                case Teams.team_by_uuid(user.id, team_id) do
                  {:ok, team} -> {:user_team, user, team}
                  _ -> {:user, user}
                end
            end
          _ -> nil
        end
      :guest -> nil
    end
  end

end
