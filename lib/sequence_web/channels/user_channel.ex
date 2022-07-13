# channel for messaging a user
defmodule SequenceWeb.UserChannel do
  use Phoenix.Channel

  alias SequenceWeb.Endpoint
  alias Sequence.{Auth, Users}

  def join("user:" <> user_id, _auth_msg, socket) do
    if user_id != socket.assigns.user_uuid do
      {:error, %{reason: "unauthorized"}}
    else
      {:ok, socket}
    end
  end

  def handle_in("update_teams", payload, socket) do
    broadcast! socket, "update_teams", payload
    {:reply, :ok, socket}
  end

  def handle_in("update_meta", payload, socket) do
    broadcast! socket, "update_meta", payload
    {:reply, :ok, socket}
  end

  def handle_in("login_approved", %{ "code" => code, "refresh_token" => refresh } = params, socket) do

    operation = if params["new"] do
      {:ok, %{ "chain" => chain }} = Auth.Guardian.decode_and_verify(refresh)
      fn user -> Auth.Guardian.refresh_token(user, false, chain) end
    else
      fn user -> Auth.Guardian.legacy_token(user, false) end
    end

    {:ok, token, _claims} =
      socket_user(socket)
      |> operation.()

    Endpoint.broadcast! "login:#{code}", "token", %{ token: token }

    {:reply, :ok, socket}
  end

  defp user_uuid(socket), do: socket.assigns.user_uuid
  defp socket_user(socket), do: Users.by_uuid!(user_uuid(socket))

end
