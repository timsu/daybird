defmodule SequenceWeb.ProjectsController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Projects}

  # GET /projects
  def index(conn, _) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         projects <- Projects.list_user_projects(user) do

      render conn, "list.json", projects: projects, user: user
    end
  end

  # GET /projects/id
  def show(conn, %{"id" => project_uuid}) do
    with user <- Guardian.Plug.current_resource(conn),
       {:ok, project} <- Projects.project_by_uuid(project_uuid) do

      render conn, "get.json", project: project, user: user
    end
  end

  # POST /projects
  def create(conn, %{ "name" => name, "shortcode" => shortcode } = _params) do
    with user <- Guardian.Plug.current_resource(conn),
         attrs <- %{
          name: name, creator_id: user.id, shortcode: shortcode
         },
         {:ok, project} <- Projects.create_project(attrs) do

      Projects.join_project(user, project, "admin")

      render conn, "get.json", project: project, user: user
    end
  end

  # PUT /projects/id
  # def update(conn, %{ "id" => project_uuid, "team" => team } = params) do
  #   attrs = Enum.reduce(["name", "description", "cover_img_url", "cover_img_pos", "type"], %{}, fn(key, acc) ->
  #     if Map.has_key?(params, key), do: Map.put(acc, Macro.underscore(key), params[key]), else: acc end)

  #   with user <- Guardian.Plug.current_resource(conn),
  #        {:ok, team} <- Teams.team_by_uuid(user.id, team),
  #        {:ok, project} <- Projects.project_by_uuid(project_uuid),
  #        :ok <- validate_team(project, team),
  #        {:ok, project} <- Projects.update_project(project, attrs) do

  #     project = project |> Projects.re_sign_url()

  #     notify_of_project_change(team, project)
  #     render conn, "update.json", project: project, user: user
  #   else
  #     {:error, :project_team_mismatch} ->
  #       {:error, :unauthorized, "You don't have access to this project"}
  #     {:error, :not_found} -> {:error, :not_found}
  #     fallback -> fallback
  #   end
  # end

  # # POST /projects/:id/add_members
  # def add_members(conn, %{ "id" => project_uuid, "team" => team_uuid, "everyone" => everyone, "users" => user_uuids }) do
  #   with user <- Guardian.Plug.current_resource(conn),
  #        {:ok, team} <- Teams.team_by_uuid(user.id, team_uuid),
  #        {:ok, project} <- Projects.project_by_uuid(project_uuid),
  #        :ok <- validate_team(project, team) do

  #     {other_members, num} = if everyone do

  #       {:ok, _} = change_project_default(project, true)

  #       notify_of_project_change(team, project, user)

  #       {_user_roles, members} = Teams.list_team_members(team)
  #       members = members |> Enum.reject(fn member -> member.uuid == user.uuid end)

  #       {members, length(members)}
  #     else
  #       users = user_uuids |> Users.get_users_by_uuid_in_team(team) # Just ignore any users not in this team
  #       {num, nil} = users |> Projects.upsert_user_projects(project, member: true)

  #       {users, num}
  #     end

  #     last_user_calls = other_members
  #     |> Enum.map(fn u -> u.id end)
  #     |> CallLogs.user_calls_last_72_hours(team.id)

  #     other_members |>
  #     Enum.each(fn recipient ->
  #       if !everyone, do: notify_of_project_change(recipient, project, user)

  #       if Timex.after?(recipient.inserted_at, Timex.shift(Timex.now, weeks: -2)) and !last_user_calls[recipient.id] do
  #         Emails.project_invite(recipient, project, team, user, Enum.reject(other_members, fn u -> u.uuid == recipient.uuid end))
  #         |> Mailer.deliver_later()
  #       end
  #     end)

  #     ProjectsTopic.update_project(team.uuid, project.uuid)
  #     json conn, %{ success: true, count: num }
  #   else
  #     {:error, :project_team_mismatch} ->
  #       {:error, :unauthorized, "You don't have access to this project"}
  #     {:error, :not_found} -> {:error, :not_found}
  #   end
  # end

  # # POST /projects/:id/remove_member
  # def remove_member(conn, %{ "id" => project_uuid, "team" => team_uuid, "user" => user_uuid }) do
  #   with admin when is_map(admin) <- Guardian.Plug.current_resource(conn),
  #       {:ok, _team} <- Teams.team_by_uuid(admin.id, team_uuid),
  #       {:ok, user} <- Users.find_by_uuid(user_uuid),
  #       {:ok, team} <- Teams.team_by_uuid(user.id, team_uuid),
  #       {:ok, project} <- Projects.project_by_uuid(project_uuid),
  #       :ok <- validate_team(project, team) do

  #     case Projects.leave_project(user, project) do
  #       {:ok, _user_project} ->
  #         ProjectsTopic.update_project(team.uuid, project.uuid)
  #         notify_of_project_change(user, project)
  #         json conn, %{ success: true }
  #       {:error, %Ecto.Changeset{errors: errors}} -> json conn, %{ success: false, errors: errors }
  #     end

  #   else
  #     {:error, :project_team_mismatch} ->
  #       {:error, :unauthorized, "You don't have access to this project"}
  #     {:error, :not_found} -> {:error, :not_found}
  #     nil -> {:error, :unauthorized}
  #   end
  # end

end
