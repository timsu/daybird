defmodule SequenceWeb.TasksController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Projects, Tasks, Utils}

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
          project_id: project.id,
          doc: params["doc"]
         },
         {:ok, task} <- Tasks.create_task(attrs) do

      render conn, "get.json", task: task
    end
  end

  # PUT /tasks/id
  def update(conn, %{ "id" => task_uuid } = params) do
    attrs = Utils.params_to_attrs params, ["title", "type", "completed_at", "archived_at",
      "doc", "deleted_at", "state", "priority"]

    with _user <- Guardian.Plug.current_resource(conn),
         {:ok, task} <- Tasks.task_by_uuid(task_uuid),
         {:ok, task} <- Tasks.update_task(task, attrs) do

      render conn, "get.json", task: task
    end
  end

end
