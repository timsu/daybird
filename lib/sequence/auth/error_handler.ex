defmodule Sequence.Auth.ErrorHandler do
  import Plug.Conn

  def auth_error(conn, {type, _reason}, _opts) do
    type_message = to_string(type)
    message = if type_message == "no_resource_found" do
      "Please provide a valid Bearer token."
    else
      type_message
    end
    body = Poison.encode!(%{error: message})
    send_resp(conn, 401, body)
  end
end
