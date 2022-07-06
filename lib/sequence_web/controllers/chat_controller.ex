defmodule SequenceWeb.ChatController do
  use SequenceWeb, :controller
  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Auth.Guardian, Chat, Teams, Users, Utils, Repo}
  alias Sequence.Chat.Message
  alias Sequence.Mobile
  alias SequenceWeb.Endpoint
  alias Sequence.Chat.{Attachment, ImageAttachment}

  # GET /chat/unread
  def unread(conn, %{ "team" => team_id}) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, team_id) do

      unread = Chat.find_unread(user, team)
      map = if unread, do: unread.unread, else: nil

      json conn, %{
        unread: map || %{}
      }
    else
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  # if we don't pass a team id, fetch all teams
  def unread(conn, _params) do
    with user <- Guardian.Plug.current_resource(conn),
         teams <- Teams.list_user_teams(user) do

      team_map = Enum.map(teams, fn team -> {team.id, team.uuid} end) |> Enum.into(%{})
      team_ids = Map.keys(team_map)

      unreads = Chat.find_unreads(user, team_ids)
      map = Enum.reduce(unreads, %{}, fn el, acc ->
        if map_size(el.unread) > 0 do
          team_uuid = team_map[el.team_id]
          Map.put(acc, team_uuid, el.unread)
        else
          acc
        end
      end)

      json conn, map
    end
  end

  # PUT /chat/unread
  def update_unread(conn, %{ "team" => team_id, "key" => key }) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, team_id) do

      {:ok, _} = Chat.update_unread_map(user, team, fn map ->
        Map.delete(map, key)
      end)

      json conn, %{ success: true }
    end
  end

  # GET /chat/messages
  def messages(conn, %{ "key" => key } = params) do
    with user <- Guardian.scoped_resource(conn, "meeting_guest") do

      {total, messages} = case Chat.find_channel(key) do
        nil -> {0, []}
        channel ->
          if Chat.can_read?(user, key) do
            total = Chat.total_messages(channel)
            messages = Chat.find_messages(channel, params["limit"] || 20, params["offset"] || 0)
              |> Enum.map(&decrypt_message(&1))
              |> Enum.map(&sign_attachments(&1))

            {total, messages}
          else
            {0,[]}
          end
      end

      render conn, "messages.json", total: total, messages: messages
    end
  end

  # POST /chat/message
  def post_message(conn, %{ "team" => team_id, "key" => key, "msg" => msg } = params) do
    to = params["to"] || []
    kind = params["kind"] || "message"
    attachment = params["attachment"]
    temp_uuid = params["temp_uuid"]
    skip_push_notification = params["skip_push_notification"]

    with user <- Guardian.scoped_resource(conn, "meeting_guest") do
      {:ok, team} = if team_id do
        Teams.team_by_uuid(user.id, team_id)
      else
        {:ok, nil}
      end

      channel = case Chat.find_channel(key) do
        nil ->
          team_db_id = if team, do: team.id, else: nil
          {:ok, channel} = Chat.create_channel(%{ team_id: team_db_id, key: key })
          channel
        channel -> channel
      end

      msg = msg
        |> normalize_message_text()

      attachment = if attachment do
        Map.delete(attachment, "thumb") |> Map.delete("bare_url")
      end

      message = %{
        sender: user.uuid,
        sender_id: user.id,
        channel_id: channel.id,
        message: msg,
        encrypted: false,
        kind: kind,
        attachments: attachment,
      }

      message = message
        |> encrypt_message()

      with {:ok, message} <- Chat.create_message(message) do

        message = message
          |> decrypt_message()
          |> sign_attachments()

        # broadcast to chat channel
        Endpoint.broadcast("chat:#{key}", "message", %{
          id: message.uuid,
          sender: user.uuid,
          team: team_id,
          msg: message.message,
          ts: message.inserted_at,
          kind: message.kind,
          attachment: message.attachments,
          temp_uuid: temp_uuid
        })

        if Message.should_broadcast(kind) do
          broadcast_to_recipients(to, team, user, channel, message, skip_push_notification, params["context"])
        end

        total = Chat.total_messages(channel)

        render conn, "message.json", message: message, total: total, temp_uuid: temp_uuid
      end
    end
  end

  defp broadcast_to_recipients(to, team, user, channel, message, skip_push_notification, context) do
    to = Enum.filter(to, fn uuid -> uuid != user.uuid end)
    msg = message.message

    # mentions
    at_mention_regex = ~r/@\{(?<display>[^║]+)║(?<user_id>[\w-]+)\}/
    mentions = if msg != nil, do: Enum.map(Regex.scan(at_mention_regex, msg), fn [_, _, user_id] -> user_id end), else: []
    msg = if msg != nil, do: Regex.replace(at_mention_regex, msg, fn _, display -> display end), else: nil

    hash_regex = ~r/#\{(?<display>[^║]+)║(?<user_id>[\w-]+)\}/
    msg = if msg != nil, do: Regex.replace(hash_regex, msg, fn _, display -> display end), else: nil

    [type, id] = String.split channel.key, ":", parts: 2
    trunc_len = if msg && String.contains?(msg, "://"), do: 300, else: 100
    trunc_msg = if msg != nil and String.length(msg) > trunc_len, do: String.slice(msg, 0, trunc_len) <> "...", else: msg

    # ensure all mentioned users are put into this set
    to = if type != "dm" and length(mentions) > 0 do
      Enum.reduce(mentions, MapSet.new(to), fn uuid, set ->
        if uuid != "all", do: MapSet.put(set, uuid), else: set
      end) |> MapSet.to_list()
    else
      to
    end

    mention_set = MapSet.new(if Enum.member?(mentions, "all"), do: to, else: mentions)

    Enum.each(to, fn user_uuid ->
      if type == "dm" or type == "room" or type == "mtg" do
        other = Users.by_uuid(user_uuid)
        if other && team && Message.should_mark_unread(message.kind) do
          unread = %{
            msg: trunc_msg,
            ts: message.inserted_at, sender: user.uuid, kind: message.kind,
            context: context || user.name
          }
          unread = if message.attachments, do: Map.put(unread, :attachment, message.attachments), else: unread
          Chat.add_unread_message(other, team, channel.key, unread)
        end

        # send a push for dm or mention
        should_push = type == "dm" or MapSet.member?(mention_set, user_uuid)

        if !skip_push_notification and should_push do
          payload = %{
            from: user.uuid,
            from_name: user.nickname || user.name,
            team: if(team, do: team.uuid),
            type: type,
            id: id,
            kind: message.kind,
            msg: trunc_msg,
            context: context,
          }
          Mobile.send_notification(other, payload)
        end
      end

      Endpoint.broadcast("user:#{user_uuid}", "message", %{
        from: user.uuid,
        from_name: user.nickname || user.name,
        team: if(team, do: team.uuid),
        type: type,
        id: id,
        msg: trunc_msg,
        kind: message.kind,
        attachment: message.attachments,
        context: context,
        mentions: mentions
      })
    end)
  end

  # PUT /chat/message
  def update_message(conn, %{ "key" => key, "id" => id } = params) do
    with _user <- Guardian.scoped_resource(conn, "meeting_guest"),
         channel when not is_nil(channel) <- Chat.find_channel(key),
         msg when not is_nil(msg) <- Chat.get_message(channel, id) do

      cond do
        params["dims"] ->
          new_attachments = Map.put(msg.attachments, "dims", params["dims"])
          Chat.update_message(msg, %{ attachments: new_attachments })
        true -> nil
      end
      :ok
    else
      nil -> {:error, :not_found}
    end
  end

  # DELETE /chat/message
  def delete_message(conn, %{ "key" => key, "id" => id }) do
    with user <- Guardian.scoped_resource(conn, "meeting_guest"),
         channel when not is_nil(channel) <- Chat.find_channel(key),
         msg when not is_nil(msg) <- Chat.get_message(channel, id),
        {:ok, _} <- Chat.update_message(msg, %{ deleted_at: Timex.now }) do
      # broadcast to chat channel
      Endpoint.broadcast("chat:#{key}", "deleted", %{
        id: id,
        sender: user.uuid,
      })
      :ok
    else
      nil -> {:error, :not_found}
      other -> other
    end
  end

  # POST /chat/wave
  def wave(conn, %{ "team" => team_id, "user" => user_id, "key" => key } = params) do
    msg = params["msg"]
    skip_push_notification = params["skip_push_notification"]
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, team_id),
         other = Users.by_uuid(user_id) do

      trunc_msg = if msg != nil and String.length(msg) > 100, do: String.slice(msg, 0, 100) <> "...", else: msg
      Chat.add_unread_message(other, team, key, %{ msg: trunc_msg, ts: Timex.now })

      payload = %{
        from: user.uuid,
        from_name: user.nickname || user.name,
        team: team.uuid,
        type: "wave",
        msg: trunc_msg,
      }

      Endpoint.broadcast("user:#{user_id}", "message", payload)
      if !skip_push_notification do
        Mobile.send_notification(other, payload)
      end

      json conn, %{ success: true }
    end
  end

  defp decrypt_message(%{message: cipher_message, encrypted: true} = message) do
    case Utils.decrypt(cipher_message) do
      {:ok, plain_message} ->
        %{message | message: plain_message, encrypted: false}

      _ ->
        message
    end
  end

  defp decrypt_message(message) do
    message
  end

  defp encrypt_message(message = %{message: plain_message}) when plain_message != "" do
    %{message | message: Utils.encrypt(plain_message), encrypted: true}
  end

  defp encrypt_message(message)do
    message
  end

  defp normalize_message_text(str) do
    str
      |> Repo.truncate_string(1000)
      |> Strip.strip_utf()
  end

  defp sign_attachments(%{attachments:  attachments} = message) when not is_nil(attachments) do
    {name, timestamp, user} =  case attachments do
      %{ "name" => name, "timestamp" => timestamp } -> {name, timestamp, message.sender}
      %{ "name" => name, "url" => url } ->
        [_whole, uuid, timestamp, _ext] = ImageAttachment.extract_info_from_url(url)
        {name, timestamp, uuid}
      end

    is_image = ImageAttachment.valid_filename(name)
    component = if is_image, do: ImageAttachment, else: Attachment
    scope = {user, timestamp}

    url = component.url({name, scope}, signed: true, expires_in: 24 * 60 * 60 )
    thumb = if(is_image, do: ImageAttachment.url({name, scope}, :thumb, signed: true, expires_in: 24 * 60 * 60), else: nil)

    attachments = attachments
    |> Map.put("url", url)
    |> Map.put("thumb", thumb)


    %{ message | attachments: attachments }
  end

  defp sign_attachments(message), do: message

end
