defmodule SequenceWeb.ProjectsController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Projects, Users, Utils}

  # GET /projects
  def index(conn, _) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         projects <- Projects.list_user_projects(user, true) do

      render conn, "list.json", projects: projects, user: user
    end
  end

  # GET /projects/id
  def show(conn, %{"id" => project_uuid}) do
    with user <- Guardian.Plug.current_resource(conn),
       {:ok, project} <- Projects.project_by_uuid(user.id, project_uuid),
       members <- Projects.list_project_members(project) do

      render conn, "get.json", project: project, user: user, members: members
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
  def update(conn, %{ "id" => project_uuid } = params) do
    attrs = Utils.params_to_attrs params, ["name", "shortcode", "deleted_at", "archived_at"]

    with user <- Guardian.Plug.current_resource(conn),
       {:ok, project} <- Projects.project_by_uuid(user.id, project_uuid),
       {:ok, project} <- Projects.update_project(project, attrs) do

      render conn, "get.json", project: project, user: user
    end
  end

  # POST /projects/:id/add_members
  def add_member(conn, %{ "id" => project_uuid, "email" => email, "role" => role }) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user.id, project_uuid),
         :ok <- validate_role(role) do

      result = case Users.find_by_email(email) do
        {:ok, existing} ->
          case Projects.get_user_project(existing, project, false) do
            nil ->
              Projects.create_user_project(%{
                role: role,
                user_id: existing.id,
                project_id: project.id
              })
            existing_up ->
              if existing_up.left_at do
                Projects.update_user_project(existing_up, %{ left_at: nil })
              else
                {:error, :bad_request, "Already a member"}
              end
          end
        _ ->
          if String.contains?(email, "@") do
            case Projects.find_project_invite(project, email) do
              nil ->
                Projects.create_project_invite(%{
                  role: role,
                  email: email,
                  creator_id: user.id,
                  project_id: project.id
                })
              _ ->
                {:error, :bad_request, "This email has already been invited"}
            end
          else
            {:error, :bad_request, "Invalid email given"}
          end
      end

      with {:ok, _} <- result,
           members <- Projects.list_project_members(project) do
        render conn, "get.json", project: project, user: user, members: members
      end
    end
  end

  def validate_role(role) do
    case role do
      "admin" -> :ok
      "member" -> :ok
      _ -> {:error, :bad_request, "Invalid role supplied"}
    end
  end

  # POST /projects/:id/remove_member
  def remove_member(conn, %{ "id" => project_uuid } = params) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user.id, project_uuid) do

      if params["email"] do
        case Projects.find_project_invite(project, params["email"]) do
          nil -> :ok
          invite ->
            Projects.update_project_invite(invite, %{ deleted_at: Timex.now })
        end
      else
        case Users.by_uuid(params["user"]) do
          nil -> :ok
          user ->
            case Projects.get_user_project(user, project) do
              nil -> :ok
              existing_up ->
                Projects.update_user_project(existing_up, %{ left_at: Timex.now })
            end
        end
      end

      members = Projects.list_project_members(project)
      render conn, "get.json", project: project, user: user, members: members
    end
  end

end
