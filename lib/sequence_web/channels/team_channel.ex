# channel for team coordination
defmodule SequenceWeb.TeamChannel do
  use Phoenix.Channel

  alias Sequence.Teams

  def join("team:" <> team_id, _auth_msg, socket) do
    user_id = socket.assigns.user_id
    case Teams.team_by_uuid(user_id, team_id) do
      {:ok, _team} ->
        {:ok, assign(socket, :team_id, team_id)}
      _ ->
        {:error, %{reason: "unauthorized"}}
    end
  end

  def terminate(_reason, _socket) do
    :ok
  end

  def handle_in("user", params, socket) do
    params = Map.merge(params, %{ userId: user_uuid(socket), clientId: client_id(socket) })
    broadcast! socket, "user", params
    {:reply, :ok, socket}
  end

  ### private helpers

  defp user_uuid(socket), do: socket.assigns.user_uuid

  defp client_id(socket), do: socket.assigns.client_id

end
