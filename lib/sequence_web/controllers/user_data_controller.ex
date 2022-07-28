defmodule SequenceWeb.UserDataController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{Users, Projects}

  action_fallback SequenceWeb.FallbackController

  # GET "/users/data"
  def get_user_data(conn, %{ "key" => key } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      {_, user_data} = user_data_helper(user, params, key)
      json conn, %{ data: user_data && user_data.value }
    end
  end

  # POST "/users/data"
  def set_user_data(conn, %{ "key" => key, "data" => data } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      {project, user_data} = user_data_helper(user, params, key)

      if !user_data do
        Users.create_user_data(%{ user_id: user.id, project_id: project && project.id, key: key, value: data })
      else
        if data do
          Users.update_user_data(user_data, %{ value: data })
        else
          Users.delete_user_data(user_data)
        end
      end
      :ok
    end
  end

  defp user_data_helper(user, params, key) do
    project = if params["project"] do
      {:ok, project} = Projects.project_by_uuid(user.id, params["project"])
      project
    end
    user_data = Users.get_user_data(user, project, key)
    {project, user_data}
  end

end
