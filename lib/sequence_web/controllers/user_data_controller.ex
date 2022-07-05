defmodule SequenceWeb.UserDataController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{Users, Teams}

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

      {team, user_data} = user_data_helper(user, params, key)

      if !user_data do
        Users.create_user_data(%{ user_id: user.id, team_id: team && team.id, key: key, value: data })
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
    team = if params["team"] do
      {:ok, team} = Teams.team_by_uuid(user.id, params["team"])
      team
    end
    user_data = Users.get_user_data(user, team, key)
    {team, user_data}
  end

end
