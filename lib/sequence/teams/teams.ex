defmodule Sequence.Teams do
  @moduledoc """
  The Teams context.
  """

  import Ecto.Query, warn: false
  alias Sequence.{Repo, Orgs, Utils}

  ### TEAM OPERATIONS

  alias Sequence.Teams.{Team, UserTeam}
  alias Sequence.Users.User

  @spec list_user_teams(User.t()) :: [Team.t()]
  def list_user_teams(user) do
    team_ids = list_user_team_ids(user)
    Repo.all(from t in Team, where: t.id in ^team_ids and is_nil(t.deleted_at), order_by: [asc: :id])
  end

  def list_user_team_ids(user) do
    Repo.all(from ut in UserTeam, select: ut.team_id, where: ut.user_id == ^user.id and is_nil(ut.left_at))
  end

  @spec list_user_teams_with_presence(User.t()) :: [Team.t()]
  def list_user_teams_with_presence(user) do
    user_team_data = Repo.all(from ut in UserTeam, select: {ut.team_id, {ut.role, ut.presence, ut.meta}}, where: ut.user_id == ^user.id and is_nil(ut.left_at))
    |> Enum.into(%{})
    team_ids = Map.keys(user_team_data)
    Repo.all(from t in Team, where: t.id in ^team_ids and is_nil(t.deleted_at), order_by: [asc: :id])
    |> Enum.map(fn t ->
      {role, presence, meta} = user_team_data[t.id]
      Map.merge(t, %{ presence: presence, role: role, user_team_meta: meta })
    end)
  end

  @spec list_team_members(Team.t()) :: {%{ integer => binary }, [User.t()]}
  def list_team_members(team) do
    user_roles = Repo.all(from ut in UserTeam, select: {ut.user_id, ut.role}, where: ut.team_id == ^team.id and is_nil(ut.left_at))
    |> Enum.into(%{})
    user_ids = Map.keys(user_roles)
    users = Repo.all(from u in User, where: u.id in ^user_ids)
    {user_roles, users}
  end

  @spec team_member_counts([integer]) :: %{ binary => integer }
  def team_member_counts(team_ids) do
    Repo.all(from ut in UserTeam, select: {ut.team_id, count(ut.user_id)},
     where: is_nil(ut.left_at) and ut.team_id in ^team_ids,
     group_by: ut.team_id)
    |> Enum.into(%{})
  end

  @spec team_member_count(integer) :: integer
  def team_member_count(team_id) do
    Repo.one(from ut in UserTeam, select: count(ut.id),
      where: ut.team_id == ^team_id and is_nil(ut.left_at))
  end

  @spec list_team_members_as_maps(Team.t()) :: [UserTeam.t()]
  def list_team_members_as_maps(team) do
    {user_roles, users} = list_team_members(team)
    Enum.map(users, fn u ->
      %{
        id: u.uuid,
        name: u.name,
        nickname: u.nickname,
        profile_img: u.profile_img,
        timezone: u.timezone,
        role: user_roles[u.id],
        email: u.email,
        mobile: User.meta(u, User.meta_mobile_push_token),
        kiosk: User.meta(u, User.meta_kiosk)
      }
    end)
  end

  def recent_team_joins(team, exclude_id, limit \\ 3) do
    exclude_id = exclude_id || 0
    user_ids = Repo.all(from ut in UserTeam, select: ut.user_id, where: ut.team_id == ^team.id and
      is_nil(ut.left_at) and ut.user_id != ^exclude_id, order_by: [desc: ut.inserted_at], limit: ^limit)
    Repo.all(from u in User, where: u.id in ^user_ids)
  end

  @spec get_user_team(User.t() | binary, Team.t() | binary, boolean) :: UserTeam.t() | nil
  def get_user_team(user, team, active_only \\ true) do
    user_id = if is_map(user), do: user.id, else: user
    team_id = if is_map(team), do: team.id, else: team

    query = from ut in UserTeam, where: ut.user_id == ^user_id and
      ut.team_id == ^team_id, limit: 1

    if active_only do
      query |> where([ut], is_nil(ut.left_at))
    else
      query
    end |> Repo.one
  end

  @spec get_user_teams(Team.t() | number()) :: [UserTeam.t()]
  def get_user_teams(team_id) when is_number(team_id) do
    Repo.all(from ut in UserTeam, where: ut.team_id == ^team_id and is_nil(ut.left_at))
  end

  def get_user_teams(team) do
    get_user_teams(team.id)
  end

  def get_user_teams_for_user(user) do
    Repo.all(from ut in UserTeam, where: ut.user_id == ^user.id and is_nil(ut.left_at))
  end

  def get_active_user_teams_count(team_id) do
    Repo.one(from ut in UserTeam, where: ut.team_id == ^team_id and is_nil(ut.status) and is_nil(ut.left_at), select: count())
  end

  def update_last_doc(user, team, doc_uuid) do
    user_id = if is_map(user), do: user.id, else: user
    team_id = if is_map(team), do: team.id, else: team
    from(ut in UserTeam, where: ut.user_id == ^user_id and ut.team_id == ^team_id)
    |> Repo.update_all(set: [last_doc: doc_uuid])
  end

  def get_teams(team_ids) do
    Repo.all(from t in Team, where: t.id in ^team_ids and is_nil(t.deleted_at))
  end

  def is_admin?(team, user) do
    ut = get_user_team(user, team)
    ut != nil && ut.role == UserTeam.role_admin
  end

  def team_admin(team) do
    ut = Repo.one(from ut in UserTeam, where: ut.team_id == ^team.id and ut.role == ^UserTeam.role_admin,
      limit: 1, preload: [:user])
    ut != nil && ut.user
  end

  def is_member?(team, user) do
    ut = get_user_team(user, team)
    ut != nil && UserTeam.active?(ut)
  end

  @spec team_by_uuid!(binary, binary) :: Team.t() | nil
  def team_by_uuid!(user_id, uuid) do
    {:ok, team} = team_by_uuid(user_id, uuid)
    team
  end

  @spec team_by_uuid(binary, binary) :: {:error, :not_found} | {:ok, Team.t()}
  def team_by_uuid(nil, _uuid), do: {:error, :not_found}
  def team_by_uuid(_user_id, nil), do: {:error, :not_found}

  def team_by_uuid(user_id, uuid) do
    with {:ok, team} <- team_by_uuid(uuid) do
      if is_member?(team, user_id), do: {:ok, team}, else: {:error, :not_found}
    end
  end

  @spec team_by_uuid(binary) :: {:error, :not_found} | {:ok, Team.t()}
  def team_by_uuid(uuid) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      team = Repo.one(from q in Team, where: q.uuid == ^uuid)
      if team, do: {:ok, team}, else: {:error, :not_found}
    else
      {:error, :not_found}
    end
  end

  @spec user_team_by_uuid(User.t() | binary, binary) :: {:ok, Team.t(), UserTeam.t()} | {:error, :not_found}
  def user_team_by_uuid(user_uuid, team_uuid) when is_binary(user_uuid) do
    with {:ok, user} <- Sequence.Users.find_by_uuid(user_uuid),
      {:ok, team, user_team} <- user_team_by_uuid(user, team_uuid) do
        {:ok, team, user_team |> Repo.preload(:user)}
    end
  end

  def user_team_by_uuid(user, uuid) do
    with {:ok, team} <- team_by_uuid(uuid) do
      case get_user_team(user, team) do
        nil -> {:error, :not_found}
        user_team -> {:ok, team, user_team}
      end
    end
  end

  def teams_by_uuid(team_uuids) do
    Repo.all(from t in Team, where: t.uuid in ^team_uuids and is_nil(t.deleted_at))
  end

  def update_team_size(team) do
    count = team_member_count(team.id)
    if team.size != count, do: update_team(team, %{ size: count })
  end

  def update_team_size_on_join(team, _user) do
    update_team_size(team)
  end

  def allow_external(team) do
    team.org_id == nil || !Team.meta(team, Team.meta_disallow_external)
  end

  def list_teams(page, page_size, params) do
    query = from(t in Team)
    |> join(:left, [t], org in Orgs.Organization, on: t.org_id == org.id)
    |> where([t], is_nil(t.deleted_at))
    |> maybe_query_name(params["name"])
    |> maybe_query_buckets(params["test"], params["variant"])
    |> maybe_query_org(params["org"])
    |> maybe_query_activated(params["activated"])

    count = Repo.one(from query, select: count(1))
    offset = page * page_size
    teams = Repo.all(from query, order_by: [desc: :id], limit: ^page_size, offset: ^offset)
    |> Repo.preload(:org)

    {count, teams}
  end

  defp maybe_query_org(queryable, nil), do: queryable
  defp maybe_query_org(queryable, org_id) do
    where(queryable, [t], t.org_id == ^org_id)
  end

  defp maybe_query_name(queryable, nil), do: queryable
  defp maybe_query_name(queryable, name) do
    where(queryable, [t, org], fragment("lower(?) LIKE ?", t.name, ^"%#{String.downcase(name)}%")
       or fragment("lower(?) LIKE ?", org.domain, ^"%#{String.downcase(name)}%"))
  end

  defp maybe_query_activated(queryable, true) do
    where(queryable, [t], not is_nil(t.activated_at))
  end
  defp maybe_query_activated(queryable, _), do: queryable

  defp maybe_query_buckets(queryable, nil, nil), do: queryable
  defp maybe_query_buckets(queryable, test, variant) do
    where(queryable, [t], fragment("id in (select team_id from team_buckets where test = ? and variant = ?)", ^test, ^variant))
  end

  def teammate_exists?(user, email) do
    !!Repo.one(from u in User,
        join: ut1 in UserTeam, on: ut1.user_id == u.id,
        join: ut2 in UserTeam, on: ut2.user_id == ^user.id and ut1.team_id == ut2.team_id,
        where: u.email == ^email, limit: 1)
  end

  def all_teammate_emails(user) do
    Repo.all(from u in User,
        join: ut1 in UserTeam, on: ut1.user_id == u.id,
        join: ut2 in UserTeam, on: ut2.user_id == ^user.id and ut1.team_id == ut2.team_id,
        select: u.email)
  end

  def activated_team_members(team) do
    Repo.one(from u in User,
      join: ut1 in UserTeam, on: ut1.user_id == u.id and ut1.team_id == ^team.id,
      where: not is_nil(u.activated_at),
      select: count())
  end

  ### TEAM CRUD

  @doc """
  Returns the list of teams.

  ## Examples

      iex> list_teams()
      [%Team{}, ...]

  """
  def list_teams do
    Repo.all(from t in Team, where: is_nil(t.deleted_at))
  end

  @doc """
  Gets a single team.

  Raises `Ecto.NoResultsError` if the Team does not exist.

  ## Examples

      iex> get_team!(123)
      %Team{}

      iex> get_team!(456)
      ** (Ecto.NoResultsError)

  """
  def get_team(id), do: Repo.get(Team, id)
  def get_team!(id), do: Repo.get!(Team, id)

  def find_demo_team() do
    if Sequence.dev? do
      get_team! 1
    else
      case Repo.one(from t in Team, where: t.domain == ^"demo.com" and is_nil(t.deleted_at), limit: 1) do
        nil -> create_team(%{ name: "Demo Team", domain: "demo.com" }) |> elem(1)
        team -> team
      end
      end
  end

  def restricted_domain(domain) do
    domain != nil && Utils.free_email_domain?(domain)
  end

  def find_all_by_org(nil), do: []
  def find_all_by_org(org) do
    Repo.all(from t in Team, where: t.org_id == ^org.id and is_nil(t.deleted_at))
  end

  def domain_info(email, existing_teams \\ MapSet.new) do
    domain = EmailChecker.Tools.domain_name(email)
    restricted = restricted_domain(domain)
    if restricted do
      {true, [], nil}
    else
      org = Orgs.org_for_domain(domain)
      teams = find_all_by_org(org)
      |> Enum.filter(fn t -> !MapSet.member?(existing_teams, t.id) end)
      |> Enum.map(fn t ->
        %{
          id: t.uuid,
          name: t.name,
          membercount: team_member_count(t.id),
          private: Team.meta(t, "private")
        }
      end)
      {false, teams, org}
    end
  end

  def maybe_validate_sso(nil, _, _), do: :ok
  def maybe_validate_sso(_, _, true), do: :ok

  def maybe_validate_sso(team, claims, _is_kiosk) do
    case Map.get(team.meta || %{}, "sso") do
      true -> if claims["sso"] == true, do: :ok, else: {:error, :unauthorized, "Single Sign On is required for this team."}
      _ -> :ok
    end
  end

  @doc """
  Creates a team.

  ## Examples

      iex> create_team(%{field: value})
      {:ok, %Team{}}

      iex> create_team(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_team(attrs \\ %{}) do
    %Team{}
    |> Team.changeset(attrs)
    |> Repo.insert()
  end

  def create_team_with_defaults(attrs \\ %{}) do
    create_team(attrs)

    # todo create default stuff
  end

  @doc """
  Updates a team.

  ## Examples

      iex> update_team(team, %{field: new_value})
      {:ok, %Team{}}

      iex> update_team(team, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_team(%Team{} = team, attrs) do
    team
    |> Team.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Team.

  ## Examples

      iex> delete_team(team)
      {:ok, %Team{}}

      iex> delete_team(team)
      {:error, %Ecto.Changeset{}}

  """
  def delete_team(%Team{} = team) do
    Repo.delete(team)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking team changes.

  ## Examples

      iex> change_team(team)
      %Ecto.Changeset{source: %Team{}}

  """
  def change_team(%Team{} = team) do
    Team.changeset(team, %{})
  end

  @doc """
  Returns the list of user_teams.

  ## Examples

      iex> list_user_teams()
      [%UserTeam{}, ...]

  """
  def list_user_teams do
    Repo.all(UserTeam)
  end

  @doc """
  Gets a single user_team.

  Raises `Ecto.NoResultsError` if the User team does not exist.

  ## Examples

      iex> get_user_team!(123)
      %UserTeam{}

      iex> get_user_team!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user_team!(id), do: Repo.get!(UserTeam, id)

  @doc """
  Creates a user_team.

  ## Examples

      iex> create_user_team(%{field: value})
      {:ok, %UserTeam{}}

      iex> create_user_team(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user_team(attrs \\ %{}) do
    %UserTeam{}
    |> UserTeam.changeset(attrs)
    |> Repo.insert()
  end

  def create_user_team(user, team, role, invite_id \\ nil, presence \\ nil) do
    create_user_team(%{
      user_id: user.id,
      team_id: team.id,
      role: role,
      invite_id: invite_id,
      presence: presence || 529 # DEFAULT_TEAM_PRESENCE -- sync with javascript!!!
    })
  end

  @doc """
  Updates a user_team.

  ## Examples

      iex> update_user_team(user_team, %{field: new_value})
      {:ok, %UserTeam{}}

      iex> update_user_team(user_team, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user_team(%UserTeam{} = user_team, attrs) do
    user_team
    |> UserTeam.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a UserTeam.

  ## Examples

      iex> delete_user_team(user_team)
      {:ok, %UserTeam{}}

      iex> delete_user_team(user_team)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user_team(%UserTeam{} = user_team) do
    Repo.delete(user_team)
  end

  def delete_user_teams(team) do
    Repo.delete_all(from ut in UserTeam, where: ut.team_id == ^team.id)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user_team changes.

  ## Examples

      iex> change_user_team(user_team)
      %Ecto.Changeset{source: %UserTeam{}}

  """
  def change_user_team(%UserTeam{} = user_team) do
    UserTeam.changeset(user_team, %{})
  end
end
