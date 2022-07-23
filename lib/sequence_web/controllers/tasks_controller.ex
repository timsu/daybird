defmodule SequenceWeb.TasksController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Projects, Tasks}

  # GET /tasks
  def index(conn, %{ "project_id" => project_uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user.id, project_uuid),
         tasks <- Tasks.list_tasks(project) do

      render conn, "list.json", tasks: tasks
    end
  end

  # GET /tasks/id
  def show(conn, %{"id" => task_uuid}) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
       {:ok, task} <- Tasks.task_by_uuid(task_uuid) do

      render conn, "get.json", task: task
    end
  end

  # POST /tasks
  def create(conn, %{ "project_id" => project_uuid, "title" => title } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user.id, project_uuid),
         short_code <- Projects.generate_short_code(project),
         attrs <- %{
          type: params["type"] || 0,
          short_code: short_code,
          title: title,
          creator_id: user.id,
          project_id: project.id
         },
         {:ok, task} <- Tasks.create_task(attrs) do

      render conn, "get.json", task: task
    end
  end

  # PUT /tasks/id
  def update(conn, %{ "id" => task_uuid } = params) do
    attrs = Enum.reduce(["title", "type", "completed_at", "archived_at", "deleted_at"], %{}, fn(key, acc) ->
      if Map.has_key?(params, key) do
        value = if String.ends_with?(key, "_at") and params[key] != nil, do: Timex.now, else: params[key]
        Map.put(acc, Macro.underscore(key), params[key])
      else
        acc
      end
    end)

    with _user <- Guardian.Plug.current_resource(conn),
         {:ok, task} <- Tasks.task_by_uuid(task_uuid),
         {:ok, task} <- Tasks.update_task(task, attrs) do

      render conn, "get.json", task: task
    end
  end

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
