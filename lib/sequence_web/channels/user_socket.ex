defmodule SequenceWeb.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel "team:*", SequenceWeb.TeamChannel
  channel "user:*", SequenceWeb.UserChannel

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  def connect(params, socket) do
    socket = socket
    |> assign(:client_id, params["client_id"])

    # token is not required for all socket request (in particular login channel)
    # but if it's passed in, we validate it and extract user id
    token = params["token"]
    legacy_client = params["hash"] == nil
    if token == nil or legacy_client do
      socket = socket
      |> assign(:user_id, nil)
      |> assign(:user_uuid, nil)
      {:ok, socket}
    else
      with {:ok, user, is_partial} <- Sequence.Auth.Guardian.resource_from_partial_token(token) do
        socket = socket
        |> assign(:user_id, user.id)
        |> assign(:user_uuid, user.uuid)
        |> assign(:partial, is_partial)
        |> maybe_assign_admin(params["admin"] && !is_partial, user)
        {:ok, socket}
      else
        _ -> :error
      end
    end
  end

  def maybe_assign_admin(socket, nil, _), do: socket

  def maybe_assign_admin(socket, _, user) do
    with :ok <- SequenceWeb.EnsureAdmin.validate_admin(user) do
      assign(socket, :admin, true)
    else
      _ -> socket
    end
  end


  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     SequenceWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  def id(socket), do: "user_socket:#{socket.assigns.client_id}"
end
