defmodule SequenceWeb.AdminController do
  use SequenceWeb, :controller
  require Logger
  import Ecto.Query, warn: false

  action_fallback SequenceWeb.FallbackController
  alias Sequence.{Auth, Billing, Buckets, CallLogs, Experiments, Feedback, Invites, Teams, Users, Slack,
    Users.User, Repo, Rooms, Rooms.Room, Surveys, Utils, Config, Deleter, Rooms, Orgs, Machines, PmfSurveys}
  alias SequenceWeb.{TeamsView, TeamsController}

  plug SequenceWeb.EnsureAdmin

  def is_admin(conn, _) do
    json conn, %{ success: true }
  end

  ### team dashboard

  def all_teams(conn, %{ "page" => page } = params) do
    page_size = 25
    {page, _} = Integer.parse(page)
    {count, teams} = Teams.list_teams(page, page_size, params)
    subs = Billing.get_subscriptions(teams)

    # get # of online users & last active date
    teams = Enum.map(teams, fn team ->
      sub = Map.get(subs, Billing.get_billing_team_id(team))
      %{
        id: team.uuid,
        db_id: team.id,
        name: team.name,
        inserted_at: team.inserted_at,
        updated_at: team.updated_at,
        activated_at: team.activated_at,
        critical_mass_at: team.critical_mass_at,
        users: team.size,
        org: if(team.org, do: %{
          id: team.org.id,
          name: team.org.name,
          domain: team.org.domain
        }),
        sub: if(sub, do: %{
          type: sub.type,
          valid: sub.valid
        })
      }
    end)

    json conn, %{ teams: teams, count: count, pages: Float.ceil(count / page_size) }
  end

  def team_user(conn, %{ "id" => id } = params) do
    user_id = params["user_id"]
    with {:ok, team} <- Teams.team_by_uuid(id) do
      {user_roles, users} = Teams.list_team_members(team)
      presence = Utils.user_map(id)
      org = if team.org_id do
        org = Orgs.get_organization! team.org_id
        %{
          id: org.id,
          name: org.name,
          domain: org.domain
        }
      end

      sub = Billing.get_subscription(team)
      sub = if sub, do: %{ type: sub.type, valid: sub.valid, next_renewal: sub.next_renewal }

      members = Enum.map(users, fn u ->
        %{
          db_id: u.id,
          id: u.uuid,
          name: u.name,
          nickname: u.nickname,
          profile_img: u.profile_img,
          timezone: u.timezone,
          role: user_roles[u.id],
          meta: u.meta,
          inserted_at: u.inserted_at,
          last_call_at: u.last_call_at,
          email: u.email,
          online: Map.has_key?(presence, u.uuid),
          invite_id: u.invite_id
        }
      end)
      invite_ids = Enum.map(members, fn u -> u.invite_id end) |> Enum.uniq()
      invited_by = Repo.all(from o in Invites.TeamInvite,
        where: o.id in ^invite_ids,
        preload: :user)
      |> Enum.map(fn i -> {i.id, if(i.user, do: i.user.name)} end)
      |> Enum.into(%{})
      user = Enum.find(members, fn m -> m.id == user_id end)

      events = []

      user_map = Enum.map(users, fn u -> {u.id, u.name} end) |> Enum.into(%{})

      json conn, %{ id: team.uuid, db_id: team.id, meta: team.meta,
        name: team.name, members: members, user: user, org: org, invited_by: invited_by, sub: sub
      }
    end
  end

  # POST /admin/get_invite
  def get_invite(conn, %{ "team" => team_id }) do
    type = "admin"
    role = "member"
    with user <- Guardian.Plug.current_resource(conn),
          {:ok, team} <- Teams.team_by_uuid(team_id) do

      {:ok, invite} = Invites.gen_team_invite(%{ user_id: user.id, team_id: team.id,
        role: role, type: type })

      json conn, %{ code: invite.code }
    end
  end

  ### user admin

  def unlink_user(conn, %{ "email" => email, "team" => team_id }) do
    case Users.find_by_email(email) do
      {:ok, user} ->
        case Teams.team_by_uuid(team_id) do
          {:ok, team} ->
            user_team = Teams.get_user_team(user, team)
            if user_team do
              Teams.update_user_team user_team, %{ left_at: Timex.now, status: Teams.UserTeam.status_purged }
              SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_teams", %{})
              SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_members", %{})
              json conn, %{ success: "Removed #{user.name} from #{team.name}" }
            else
              {:error, :not_found, "User isn't a member of that team"}
            end
          _ -> {:error, :not_found, "Could not find a team with that id"}
        end
      _ -> {:error, :not_found, "Could not find a user with that email"}
    end
  end

  def delete_user(conn, %{ "email" => email, "team" => nil }) do
    with {:ok, user} <- Users.find_by_email(email) do
      if SequenceWeb.EnsureAdmin.validate_admin(user) == :ok and !Sequence.dev? do
        {:error, :bad_request, "Don't be an idiot"}
      else
        teams = Teams.list_user_teams(user)
        |> Enum.filter(fn team -> team.size == nil or team.size < 2 end)
        |> Enum.map(fn team -> %{
          id: team.uuid,
          name: team.name
        } end)
        json conn, %{ teams: teams }
      end
    else
      _ -> {:error, :not_found, "Could not find a user with that email"}
    end
  end

  def delete_user(conn, %{ "email" => email, "team" => "none" }) do
    with {:ok, user} <- Users.find_by_email(email) do

      Deleter.delete_user_helper(user)

      json conn, %{ success: true }
    end
  end

  def delete_user(conn, %{ "email" => email, "team" => team }) do
    with {:ok, user} <- Users.find_by_email(email),
         {:ok, team} <- Teams.team_by_uuid(user.id, team) do

      Deleter.delete_user_helper(user)
      Deleter.delete_team_helper(team)

      json conn, %{ success: true }
    else
      _ -> {:error, :not_found, "Could not find that team"}
    end
  end

  def update_user_email(conn, %{ "email" => email, "new_email" => new_email }) do
    with {:ok, user} <- Users.find_by_email(email) do

      Users.update_user(user, %{ email: new_email })

      json conn, %{ success: true}
    end
  end

  def delete_team(conn, %{ "confirm" => confirm, "team" => team, "deleteOrg" => delete_org }) do
    with {:ok, team} <- Teams.team_by_uuid(team) do
      org = if delete_org && team.org_id, do: Orgs.get_organization!(team.org_id)

      if confirm do
        Deleter.delete_team_helper(team)
        if org, do: Deleter.delete_org_helper(org)
        json conn, %{ success: true }
      else
        name = if org, do: "#{team.name} and org #{org.name}", else: team.name
        json conn, %{ team: %{ name: name } }
      end
    else
      _ -> {:error, :not_found, "Could not find that team"}
    end
  end


  def admin_user(conn, %{ "email" => email, "team" => team, "op" => op }) do
    with {:ok, user} <- Users.find_by_email(email),
         {:ok, team} <- Teams.team_by_uuid(team) do

      ut = Teams.get_user_team(user, team)

      {:ok, _} = case op do
        "admin" ->
          Teams.update_user_team(ut, %{ role: "admin" })
        "member" ->
          Teams.update_user_team(ut, %{ role: "member" })
        "remove" ->
          Teams.update_user_team(ut, %{ left_at: Timex.now })
      end

      json conn, %{ success: true }
    end
  end

  # POST /admin/delete_slack_user
  def delete_slack_user(conn, %{ "email" => email }) do
    with {:ok, user} <- Users.find_by_email(email) do
      Repo.delete_all(from u in Slack.SlackUser, where: u.user_id == ^user.id)
      json conn, %{ success: true }
    end
  end

  ### buckets

  def get_experiments(conn, _) do
    {user, team, _} = Experiments.experiments()
    render conn, "experiments.json", experiments: user ++ team
  end

  def update_buckets(conn, %{ "type" => type, "uuids" => uuids, "test" => test, "variant" => variant }) do
    try do
      update_buckets(conn, type, uuids, test, variant)
    rescue
      Ecto.Query.CastError -> {:error, :bad_request, "Invalid UUIDs"}
    end
  end

  defp update_buckets(conn, "team", uuids, test, variant) do
    with teams <- Teams.teams_by_uuid(uuids) do
      if length(uuids) == length(teams) do
        Enum.each(teams, fn team ->
          Experiments.update_team_test(team, test, variant)
          SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_buckets", %{})
        end)
        json conn, %{ success: true }
      else
        {:error, :not_found, "Could not find all team uuids"}
      end
    end
  end

  defp update_buckets(conn, "user", uuids, test, variant) do
    with users <- Users.by_uuid(uuids) do
      if length(uuids) == length(users) do
        Enum.each(users, fn user ->
          Experiments.update_user_test(user, test, variant)
          SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_buckets", %{})
        end)
        json conn, %{ success: true }
      else
        {:error, :not_found, "Could not find all user uuids"}
      end
    end
  end

  defp update_buckets(conn, "email", emails, test, variant) do
    Enum.each(emails, fn email ->
      Experiments.update_email_test(email, test, variant)
      SequenceWeb.Endpoint.broadcast("email:#{email}", "update_buckets", %{})
    end)
    json conn, %{ success: true }
  end

  ### merge teams

  def merge_teams(conn, %{ "team1" => team1, "team2" => team2 } = params) do
    with {:same_team, false} <- {:same_team, team1 == team2},
         {:ok, team1} <- Teams.team_by_uuid(team1),
         {:ok, team2} <- Teams.team_by_uuid(team2) do

      if params["confirm"] do
        Teams.update_team(team1, %{ size: 0, deleted_at: Timex.now })
        {members2, _} = Teams.list_team_members(team2)

        user_teams1 = Teams.get_user_teams(team1)
        new_members = Enum.filter(user_teams1, fn ut -> !Map.has_key?(members2, ut.user_id) end)
        Enum.each(new_members, fn ut ->
          Teams.create_user_team(%{
            user_id: ut.user_id,
            team_id: team2.id,
            role: ut.role,
            invite_id: ut.invite_id,
            presence: ut.presence
          })
        end)

        Enum.each(user_teams1, fn ut ->
          Teams.update_user_team(ut, %{ left_at: Timex.now })
        end)

        Users.get_users(Enum.map(user_teams1, &(&1.user_id)))
        |> Enum.each(fn user ->
          SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "update_teams", %{})
          if User.meta(user, User.meta_last_team) == team1.uuid do
            Users.update_user_meta(user, %{ User.meta_last_team => team2.uuid })
          end
        end)

        Teams.update_team(team2, %{ size: (team2.size || 0) + length(new_members) })
        SequenceWeb.Endpoint.broadcast("team:#{team2.uuid}", "update_team", %{})
        json conn, %{ message: "Success! Teams are merged", type: "success" }
      else
        message = "This will merge '#{team1.name}' (size #{team1.size}) into '#{team2.name}' (size #{team2.size}) " <>
          " and delete the first team forever. Are you sure?"
        json conn, %{ message: message, type: "confirm" }
      end

    else
      {:same_team, true} -> {:error, :bad_request, "Can't merge same teams"}
      {:error, :not_found} -> {:error, :bad_request, "Could not find one of those teams"}
    end
  end

  ### update org

  def update_org(_conn, %{ "team_id" => team_id, "del" => true }) do
    with {:ok, team} <- Teams.team_by_uuid(team_id),
         {:ok, _} <- Teams.update_team(team, %{ org_id: nil }) do
      :ok
    end
  end

  def update_org(_conn, %{ "team_id" => team_id, "updates" => updates }) do
    with {:ok, team} <- Teams.team_by_uuid(team_id) do

      domain_org = if updates["domain"] != nil, do: Orgs.org_for_domain(updates["domain"])

      result = if team.org_id do
        org = Orgs.get_organization!(team.org_id)
        if domain_org != nil and org.id != domain_org.id do
          Teams.update_team(team, %{ org_id: domain_org.id })
        else
          Orgs.update_organization(org, updates)
        end
      else
        case if(domain_org, do: {:ok, domain_org}, else: Orgs.create_organization(updates)) do
          {:ok, org} -> Teams.update_team(team, %{ org_id: org.id })
          other -> other
        end
      end

      with {:ok, _} <- result do
        :ok
      end
    end
  end

  ###

  def to_pst(datetime) do
    datetime
    |> Timex.Timezone.convert("Etc/UTC")
    |> Timex.Timezone.convert("America/Los_Angeles")
  end

  defp to_date(datetime) do
    datetime
    |> to_pst
    |> Timex.to_date
  end

end
