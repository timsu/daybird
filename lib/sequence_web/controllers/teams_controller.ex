defmodule SequenceWeb.TeamsController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{Auth.Guardian, Teams, Teams.Team, Teams.UserTeam, Users, Users.User,
    Orgs, Utils}

  action_fallback SequenceWeb.FallbackController

  # GET /teams
  def index(conn, _params) do
    with user <- Guardian.Plug.current_resource(conn),
         :ok <- assert_user(user),
         teams <- Teams.list_user_teams_with_presence(user) do

      primary = if Enum.empty?(teams) do
        nil
      else
        primary_team_id = Map.get(user.meta || %{}, User.meta_last_team)
        team = if primary_team_id do
          Enum.find(teams, fn team -> to_string(team.uuid) == primary_team_id end)
        end || hd(teams)
        team |> add_members()
      end
      org_id = user.org_id || (primary != nil && primary.org_id)
      org = if org_id, do: Orgs.get_organization(org_id)

      claims = Guardian.current_claims(conn)
      is_kiosk = User.meta(user, User.meta_kiosk())

      with :ok <- Teams.maybe_validate_sso(primary, claims, is_kiosk) do
        render conn, "list.json", user: user, teams: teams, primary: primary, org: org
      end
    end
  end

  # GET /guest_info
  def guest_info(conn, _params) do
    with user <- Guardian.scoped_resource(conn, "meeting_guest"),
         :ok <- assert_user(user) do
      # replace meta with a blank guest meta
      meta = user.meta || %{}
      user = Map.put(user, :meta, %{ "guest" => true, "av" => meta["av"], "mav" => meta["mav"] })
      render conn, "list.json", user: user, teams: [], primary: nil, org: nil
    end
  end

  # GET /teams/id
  def show(conn, %{ "id" => id }) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team, user_team} <- Teams.user_team_by_uuid(user, id) do
      org = if team.org_id, do: Orgs.get_organization(team.org_id)
      team = team |> add_members() |> add_user_team_attrs(user_team)

      render conn, "get.json", team: team, org: org
    end
  end

  # GET /domain_info
  def domain_info(conn, _) do
    with user <- Guardian.Plug.current_resource(conn) do
      existing_teams = Teams.get_user_teams_for_user(user)
      |> Enum.map(fn ut -> ut.team_id end)
      |> MapSet.new

      {restricted, teams, org} = Teams.domain_info(user.email, existing_teams)

      org_json = if org, do: %{ id: org.uuid, name: org.name }
      json conn, %{ restricted: restricted, domain_teams: teams, org: org_json }
    end
  end

  # PUT /teams/id
  # update team
  @spec update(Plug.Conn.t(), map) :: {:error, :not_found}
  def update(conn, %{ "id" => id } = params) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team, user_team} <- Teams.user_team_by_uuid(user, id),
         {:ok, team} <- update_team(team, user_team, params),
         {:ok, user_team} <- update_user_team(user_team, params) do

      team = add_members(team) |> add_user_team_attrs(user_team)
      org = if team.org_id, do: Orgs.get_organization(team.org_id)
      render conn, "get.json", team: team, org: org
    end
  end

  defp ensure_admin(user_team), do: if user_team.role == UserTeam.role_admin, do: :ok, else: {:error, :unauthorized}

  defp update_team(team, user_team, params) do
    attrs = if Map.has_key?(params, "name"), do: %{ name: params["name"] }, else: %{}
    attrs = if Map.has_key?(params, "domain"), do: Map.put(attrs, "domain", params["domain"]), else: attrs
    attrs = if Map.has_key?(params, "meta") do
      Map.put(attrs, "meta", team.meta |> Utils.updated_meta_field(params["meta"]))
    else
      attrs
    end

    if Kernel.map_size(attrs) > 0 do
      with :ok <- ensure_admin(user_team), {:ok, team} <- Teams.update_team(team, attrs) do
        SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_team", %{})
        {:ok, team}
      end
    else
      {:ok, team}
    end
  end

  defp update_user_team(user_team, params) do
    attrs = %{}
    attrs = if Map.has_key?(params, "presence"), do: Map.put(attrs, :presence, params["presence"]), else: attrs
    attrs = if Map.has_key?(params, "user_team_meta") do
      Map.put(attrs, :meta, user_team.meta |> Utils.updated_meta_field(params["user_team_meta"]))
    else
      attrs
    end

    if Kernel.map_size(attrs) > 0 do
      Teams.update_user_team(user_team, attrs)
    else
      {:ok, user_team}
    end
  end


  # PUT /teams/id/settings
  # update user-team settings
  def update_settings(conn, %{ "id" => id } = params) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, _team, user_team} <- Teams.user_team_by_uuid(user, id),
         {:ok, _user_team} <- update_user_team(user_team, params) do

      json conn, %{ success: true }
    end
  end

  # POST /teams/create
  def create_team(conn, %{ "name" => name, "presence" => presence } = params) do
    org_data = params["org"]
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, org} <- get_org(org_data, user),
         {:ok, team} <- Teams.create_team_with_defaults(%{
            name: name,
            size: 0,
            meta: params["meta"],
            domain: params["domain"],
            org_id: if(org, do: org.id),
            origin_type: params["source"],
            creator_id: user.id,
          }) do

      {:ok, user_team} = Teams.create_user_team(user, team, UserTeam.role_admin, nil, presence)
      Teams.update_team_size_on_join(team, user)

      team = team |> add_members() |> add_user_team_attrs(user_team)
      SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_teams", %{})

      if user.origin_type == "unknown" do
        {:ok, _} = Users.update_user(user, %{origin_type: "champion"})
      end

      render conn, "get.json", team: team, org: org
    end
  end

  defp get_org(nil, user) do
    org = if user.org_id, do: Orgs.get_organization(user.org_id)
    {:ok, org}
  end

  defp get_org(org_data, _user) do
    if org_data["id"] do
      Orgs.by_uuid(org_data["id"])
    else
      existing = if org_data["domain"], do: Orgs.org_for_domain(org_data["domain"])
      if existing do
        {:ok, existing}
      else
        Orgs.create_organization(%{
          name: org_data["name"],
          domain: org_data["domain"],
        })
      end
    end
  end

  # POST /teams/id/leave
  # leave team
  def leave(conn, %{ "id" => id }) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, id),
         ut <- Teams.get_user_team(user, team) do

      if ut && UserTeam.active?(ut) do
        Teams.update_user_team(ut, %{ left_at: Timex.now, status: UserTeam.status_left })
      end

      SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_teams", %{})
      SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_team", %{})
      json conn, %{ success: true }
    end
  end

  # POST /teams/id/join
  # join team
  def join(conn, %{ "id" => id }) do
    with %User{} = user <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(id) do

      ut = Teams.get_user_team(user, team, false)

      # Should be idempotent
      result = cond do
        ut && UserTeam.active?(ut) -> json conn, %{ success: true }
        user.org_id != nil and team.org_id == user.org_id and Team.meta(team, "private") != true ->
          {:ok, _} = if ut do
            Teams.update_user_team(ut, %{ deleted_at: nil })
          else
            Teams.create_user_team(user, team, UserTeam.role_member, nil)
          end
          :ok
        true ->
          admin = Teams.team_admin(team)
          admin_name = if admin, do: " (e.g. #{admin.name})", else: ""
          message = "Please contact someone on the team#{admin_name} for an invite to this team."
          {:error, :unauthorized, message}
      end

      SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_team", %{})

      if user.origin_type == "unknown" do
        {:ok, _} = Users.update_user(user, %{ origin_type: if(Timex.after?(team.inserted_at,
        Timex.shift(Timex.now, weeks: -2)), do: "join-new", else: "join-exist")})
      end

      result
    end
  end

  # DELETE /teams/id/members/user_uuid
  # remove a member from the team
  def remove_member(conn, %{ "id" => id, "user_id" => user_uuid }) do
    with admin <- Guardian.Plug.current_resource(conn),
         {:ok, team, admin_user_team} <- Teams.user_team_by_uuid(admin, id),
         :ok <- ensure_admin(admin_user_team) do

      user = Users.by_uuid!(user_uuid)
      result = case Teams.get_user_team(user, team) do
        nil -> {:error, :unauthorized, "The user is not a member of the team."}
        ut -> with {:ok, _} <- Teams.update_user_team(ut, %{ left_at: Timex.now, status: UserTeam.status_deactivated }) do
          json conn, %{ success: true }
        end
      end

      SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_team", %{})
      result
    end
  end

  # PUT /teams/id/members/user_uuid
  # updates a member
  def update_member(conn, %{ "id" => id, "user_id" => user_uuid, "role" => role }) do
    with admin <- Guardian.Plug.current_resource(conn),
         {:ok, team, admin_user_team} <- Teams.user_team_by_uuid(admin, id),
         :ok <- ensure_admin(admin_user_team) do

      user = Users.by_uuid!(user_uuid)
      case Teams.get_user_team(user, team) do
        nil -> {:error, :unauthorized, "The user is not a member of the team."}
        ut ->
          with {:ok, _user_team} <- Teams.update_user_team(ut, %{ role: role }) do
            json conn, %{ success: true }
          end
      end
    end
  end

  ### helpers

  def add_members(team) do
    members = Teams.list_team_members_as_maps(team)
    Map.put(team, :members, members)
  end

  def add_user_team_attrs(team, user_team) do
    Map.merge(team, %{
      last_doc: user_team.last_doc,
      presence: user_team.presence,
      user_team_meta: user_team.meta,
      role: user_team.role
    })
  end

  def assert_user(user) do
    case user do
      nil -> {:error, :unauthorized}
      _ -> :ok
    end
  end

end
