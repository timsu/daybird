defmodule SequenceWeb.MobileController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{Mobile, Users, Users.User, Teams}

  action_fallback SequenceWeb.FallbackController

  # POST /mobile/register_token
  def register_token(conn, %{ "type" => type, "token" => token, "device_id" => device_id, "name" => name }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         p <- Mobile.get_push_token_by_device_id(user, type, device_id) do

      if !p do
        Mobile.create_push_token(%{ user_id: user.id, type: type, device_id: device_id, token: token, name: name })
      else
        attr = %{}
        attr = if p.deleted_at != nil, do: Map.put(attr, :deleted_at, nil), else: attr
        attr = if p.token != token, do: Map.put(attr, :token, token), else: attr
        if map_size(attr) > 0, do: Mobile.update_push_token(p, attr)
      end

      if !User.meta(user, User.meta_mobile_push_token) do
        meta = Map.put(user.meta || %{}, User.meta_mobile_push_token, 1)
        Users.update_user(user, %{ meta: meta })
      end

      json conn, %{ success: true }
    end
  end

  # POST /mobile/unregister_token
  def unregister_token(conn, %{ "type" => type, "token" => token }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      active_tokens = Mobile.list_active_tokens(user)
      found = Enum.filter(active_tokens, fn t -> t.type == type and t.token == token end)

      if !Enum.empty?(found) do
        with _ <- Enum.each(found, &Mobile.soft_delete/1) do
          :ok
        end
      else
        {:error, :not_found}
      end
    end
  end

  # GET /mobile/active_tokens
  def active_tokens(conn, _) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      active_tokens = Mobile.list_active_tokens(user)
      |> Enum.map(fn t -> %{ name: t.name, type: t.type, inserted_at: t.inserted_at } end)

      json conn, %{ tokens: active_tokens }
    end
  end

  # POST /mobile/call_user
  def call_user(conn, %{ "user" => other_uuid, "call" => call_id, "team" => team_id } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, team_id),
         other = Users.by_uuid(other_uuid) do

      if other.id != user.id do
        payload = %{
          from: user.uuid,
          from_name: user.nickname || user.name,
          team: team.uuid,
          type: "call",
          call_id: call_id,
        }
        if params["call_info"] do
          payload = Jason.encode!(params["call_info"])
          Redix.command(:redix, ["SET", "call:" <> call_id, payload,
            "PX", 3600_000])
        end
        Mobile.send_notification(other, payload, false)
      end

      :ok
    end
  end

  # POST /mobile/call_info
  def call_info(conn, %{ "call" => call_id }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do
      case Redix.command(:redix, ["GET", "call:" <> call_id]) do
        {:ok, data} ->
          call_info = Jason.decode!(data)
          json conn, %{ info: call_info }
        _ ->
          json conn, %{ info: nil }
      end
    end
  end

  # POST /mobile/notify
  def notify(conn, %{ "users" => user_uuids, "team" => team_id, "type" => type } = params) do
    notification_payload = params["payload"] || %{}
    msg = notification_payload["message"]
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
        {:ok, team} <- Teams.team_by_uuid(user.id, team_id) do

    Enum.each(user_uuids, fn user_uuid ->
      payload = %{
        from: user.uuid,
        from_name: user.nickname || user.name,
        team: team.uuid,
        type: type,
        msg: msg,
        payload: notification_payload
      }
      other = Users.by_uuid(user_uuid)
      Mobile.send_notification(other, payload)
    end)

    :ok
  end
end

end
