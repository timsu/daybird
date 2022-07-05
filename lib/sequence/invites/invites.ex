defmodule Sequence.Invites do
  @moduledoc """
  The Invites context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  @code_length 10
  @code_expiry_days 30

  alias Sequence.{Invites.TeamInvite, Teams.UserTeam, Teams, Teams.Team, Users, Users.User, Orgs, Leads, Leads.Lead }

  def type_email, do: "email"
  def type_link, do: "link"
  def type_slack, do: "slack"

  def validate_role(user_team, role) do
    cond do
      user_team.role == UserTeam.role_admin -> :ok
      user_team.role == UserTeam.role_member and
        (role == UserTeam.role_member || role == UserTeam.role_guest) -> :ok
      true -> {:error, :bad_request, "You cannot invite users to that role"}
    end
  end

  def validate_invite(invite_code, org_id_or_user \\ nil)

  def validate_invite(invite_code, %User{email: email, org_id: nil} = user) do org = Orgs.org_for_email(email)
    if org do
      {:ok, user} = Users.update_user(user, %{ org_id: org.id })
      validate_invite(invite_code, user.org_id)
    else
      validate_invite(invite_code)
    end
  end

  def validate_invite(invite_code, %User{org_id: org_id}) do
    validate_invite(invite_code, org_id)
  end

  def validate_invite(invite_code, org_id) do
    cond do
      invite_code == nil -> {:ok, nil, nil}
      true -> case invite_by_code(invite_code) do
        {:ok, invite} ->
          team = Teams.get_team!(invite.team_id)

          with %Lead{} = lead <- Leads.find_lead_by_team_invite_id(invite.id) do
            Leads.update_lead(lead, %{ joined_at: Timex.now() })
          end

          org_ok = team.org_id == nil || team.org_id == org_id
          if org_ok || Teams.allow_external(team) do
            {:ok, invite, team}
          else
            org = Orgs.get_organization! team.org_id
            {:error, :bad_request, "This team is restricted to #{org.domain} email addresses."}
          end
        {:error, :not_found} -> {:error, :bad_request, "Invite code is invalid or expired."}
      end
    end
  end

  def join_team(user, invite, team) do
    ut = Teams.get_user_team(user, team)
    role = invite.role || UserTeam.role_member
    if ut do
      if ut.left_at do
        Teams.update_user_team(ut, %{
          role: role,
          status: nil,
          left_at: nil,
          invite_id: invite.id
        })
      end
    else
      Teams.create_user_team(user, team, role, invite.id)
    end

    Teams.update_team_size_on_join(team, user)
    if user.origin_type == "unknown" do
      {:ok, _} = Users.update_user(user, %{origin_type: if(Timex.after?(team.inserted_at,
      Timex.shift(Timex.now, weeks: -2)), do: "join-new", else: "join-exist")})
    end
    SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_members", %{})
    SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_teams", %{})
  end

  @doc """
  Returns the list of team_invites.

  ## Examples

      iex> list_team_invites()
      [%TeamInvite{}, ...]

  """
  def list_team_invites do
    Repo.all(TeamInvite)
  end

  @doc """
  Gets a single team_invite.

  Raises `Ecto.NoResultsError` if the Team invite does not exist.

  ## Examples

      iex> get_team_invite!(123)
      %TeamInvite{}

      iex> get_team_invite!(456)
      ** (Ecto.NoResultsError)

  """
  def get_team_invite!(id), do: Repo.get!(TeamInvite, id)

  @doc """
  Gets a single team_invite that matches the given code and is not expired.
  Only matches characters after the last '-'.

  ## Examples

      iex> create_team_invite(%{code: "aSdF123"})

      iex> invite_by_code("aSdF123")
      {:ok, %TeamInvite{}}

      iex> invite_by_code("my-wisp-team-name-aSdF123")
      {:ok, %TeamInvite{}}

      iex> invite_by_code("aSdF123-my-wisp-team-name")
      {:error, :not_found}
  """
  def invite_by_code(code) do
    code = Enum.at(String.split(code, "-"), -1)
    invite = Repo.one(from t in TeamInvite, where: t.code == ^code and
      (is_nil(t.expires_at) or t.expires_at >= ^Timex.now), preload: :user)
    if invite, do: {:ok, invite}, else: {:error, :not_found}
  end

  # Get invite whether expired or not
  def invite_by_code!(code) do
    code = Enum.at(String.split(code, "-"), -1)
    invite = Repo.one(from t in TeamInvite, where: t.code == ^code)
    cond do
      invite == nil -> {:error, :not_found}
      invite.expires_at == nil -> {:ok, invite}
      Timex.compare(invite.expires_at, Timex.now) > 0 -> {:ok, invite}
      true -> {:expired, invite}
    end
  end

  @doc """
  Creates a team_invite.

  ## Examples

      iex> create_team_invite(%{field: value})
      {:ok, %TeamInvite{}}

      iex> create_team_invite(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_team_invite(attrs \\ %{}) do
    %TeamInvite{}
    |> TeamInvite.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Generates an invite code. Avoids the "-" character so it can be used as a delimiter between the
  team name and the actual code, i.e. so "team-name-a1s2d3" can be resolved to the code "a1s2d3".
  """
  def gen_code, do: String.replace(Repo.generate_code(@code_length), "-", "_")

  def invite_count_today(user, type) do
    case Repo.one(from t in TeamInvite, select: type(sum(t.count), :integer), where: t.user_id == ^user.id and
        t.type == ^type and t.inserted_at > ^Timex.shift(Timex.now, days: -1)) do
      nil -> 0
      count -> count
    end
  end

  # create new invite, tracking type and # of invites sent
  def gen_single_invite(user, team, role, type \\ type_email(), count \\ 1) do
    code = gen_code()
    expires_at = Timex.shift(Timex.now, days: @code_expiry_days)
    attrs = %{ user_id: user.id, team_id: team.id, role: role, count: count, type: type, code: code, expires_at: expires_at }

    create_team_invite(attrs)
  end

  # create or resuse invite
  def gen_team_invite(attrs, code \\ gen_code(), expires_at \\ Timex.shift(Timex.now, days: @code_expiry_days)) do
    type = attrs[:type] || type_link()
    forever = attrs[:forever]
    existing = if attrs[:user_id] && attrs[:team_id] do
      query = from(t in TeamInvite)
      |> where([t], t.team_id == ^attrs.team_id and t.user_id == ^attrs.user_id and t.role == ^attrs.role and t.type == ^type)
      |> limit(1)

      expires_threshold = Timex.shift(Timex.now, days: 14)
      if(forever, do: where(query, [t], is_nil(t.expires_at)), else: where(query, [t], t.expires_at > ^expires_threshold))
      |> Repo.one()
    end

    if existing do
      {:ok, existing}
    else
      expires_at = if forever, do: nil, else: expires_at
      attrs = Map.merge(attrs, %{ code: code, expires_at: expires_at })
      create_team_invite(attrs)
    end
  end

  def generate_unique_code(user) do
    code = gen_code()
    case invite_by_code(code) do
      {:ok, _} -> generate_unique_code(user)
      _ ->
        expires_at = Timex.shift(Timex.now, days: @code_expiry_days)
        {:ok, _} = create_team_invite(%{ user_id: user.id, code: code, role: UserTeam.role_member, expires_at: expires_at})
        code
    end
  end

  @doc """
  Updates a team_invite.

  ## Examples

      iex> update_team_invite(team_invite, %{field: new_value})
      {:ok, %TeamInvite{}}

      iex> update_team_invite(team_invite, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_team_invite(%TeamInvite{} = team_invite, attrs) do
    team_invite
    |> TeamInvite.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a TeamInvite.

  ## Examples

      iex> delete_team_invite(team_invite)
      {:ok, %TeamInvite{}}

      iex> delete_team_invite(team_invite)
      {:error, %Ecto.Changeset{}}

  """
  def delete_team_invite(%TeamInvite{} = team_invite) do
    Repo.delete(team_invite)
  end

  def delete_team_invites(%Team{} = team) do
   from(ti in TeamInvite, where: ti.team_id == ^team.id) |> Repo.delete_all
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking team_invite changes.

  ## Examples

      iex> change_team_invite(team_invite)
      %Ecto.Changeset{source: %TeamInvite{}}

  """
  def change_team_invite(%TeamInvite{} = team_invite) do
    TeamInvite.changeset(team_invite, %{})
  end
end
