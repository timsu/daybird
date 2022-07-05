defmodule SequenceWeb.InvitesController do
  use SequenceWeb, :controller
  require Logger

  action_fallback SequenceWeb.FallbackController
  alias Sequence.{Invites, Teams, Teams.UserTeam, Teams.Team}

  @max_emails_per_day 20

  # GET /valid_invite
  # checks a user's invite code
  def valid_invite(conn, %{ "invite" => code }) do
    case Invites.invite_by_code(code) do
      {:error, _} -> {:error, :bad_request, "This invite code is invalid or expired."}
      {:ok, invite} ->
        team = Teams.get_team!(invite.team_id)
        recent_joins = Teams.recent_team_joins(team, invite.user_id)
        render conn, "invite_v3.json", team: team, invite: invite, recent_team_joins: recent_joins
    end
  end

  # POST /invite
  def get_invite(conn, %{ "team" => team_id } = params) do
    type = params["type"]
    forever = params["forever"]
    role = "member"
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, team, user_team} <- Teams.user_team_by_uuid(user, team_id),
         :ok <- Invites.validate_role(user_team, role),
         :ok <- validate_not_locked(team, user_team) do

      {:ok, invite} = Invites.gen_team_invite(%{ user_id: user.id, team_id: team.id,
        role: role, type: type, forever: forever })

      json conn, %{ code: invite.code }
    else
      nil -> {:error, :unauthorized}
      other -> other
    end
  end

  defp validate_not_locked(team, user_team) do
    if Team.meta(team, Team.meta_locked) do
      if user_team.role == UserTeam.role_admin do
        :ok
      else
        team_admin = Teams.team_admin(team)
        {:error, :bad_request, "Invite is locked. Please contact #{team_admin.name} to invite someone."}
      end
    else
      :ok
    end
  end

  # POST /new_invite
  # generates new invite code
  def new_invite(conn, _) do
    with user <- Guardian.Plug.current_resource(conn) do
      code = Invites.generate_unique_code(user)

      json conn, %{ code: code }
    end
  end

  # check the # of invites sent per day
  defp check_invite_count(user) do
    invites_today = Invites.invite_count_today(user, "email")
    if invites_today < @max_emails_per_day, do: :ok, else:
      {:error, :bad_request, "You've sent too many email invites for today. To prevent spam, please contact the Tandem team to send more invites."}
  end

  # check the validity of recipient emails
  defp validate_receipient_emails(recipients) do
    result = Enum.map(recipients, fn r -> r["email"] end)
    |> Enum.map(fn e -> {e, Sequence.dev? || Sequence.test? || EmailChecker.valid?(e)} end)
    |> Enum.find(fn {_, valid} -> valid == false end)

    case result do
      {invalid, _} -> {:error, :bad_request, "Invalid email: #{invalid}"}
      _ -> :ok
    end
  end

  # POST /send_invites
  def send_invites(conn, %{ "team" => team_uuid, "recipients" => recipients }) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team, user_team} <- Teams.user_team_by_uuid(user, team_uuid),
         :ok <- validate_not_locked(team, user_team),
         :ok <- check_invite_count(user),
         :ok <- validate_receipient_emails(recipients) do

      new_invite_count = length(recipients)
      {:ok, invite} = Invites.gen_single_invite(user, team, UserTeam.role_member, Invites.type_email, new_invite_count)
      recipients
      |> Enum.each(fn r ->
        # send an email
        IO.puts("#{r} -> #{inspect invite}")
      end)
      json conn, %{ success: true }
    end
  end
end
