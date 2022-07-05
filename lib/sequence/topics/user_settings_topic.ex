defmodule Sequence.Topics.UserSettingsTopic do
  alias Sequence.Topicflow.{Registry, Topic}
  alias Sequence.Topics.UserSettingsTopic.BackingData

  alias Sequence.{Users, Users.UserData, Presence}

  @topic_identifier "user_settings"

  alias Sequence.Topics.UserSettingsTopic

  defstruct user_uuid: nil

  def refresh(user_uuid) do
    Registry.send_if_present(topic_id(user_uuid), :refresh)
  end

  def topic_id(%Users.User{ uuid: user_uuid }) do
    topic_id(user_uuid)
  end

  def topic_id(user_uuid) do
    "#{@topic_identifier}:#{user_uuid}"
  end

  def init(id) do
    case String.split(id, ":") do
      [@topic_identifier, user_uuid] ->
        {:ok, %UserSettingsTopic{user_uuid: user_uuid }}

      _ ->
        {:error, :invalid_id}
    end
  end

  def handle_info(
        :refresh,
        topic,
        _,
        _
      ) do

    {shared_bulk, topic} = retrieve_shared_bulk(topic)

    :ok = Topic.cast_set_keys_bulk_no_reply(self(), nil, shared_bulk)
    topic
  end

  def retrieve_shared_bulk(%UserSettingsTopic{user_uuid: uuid} = topic) do

    case Sequence.Users.find_by_uuid(uuid) do
      {:ok, user} ->

        bulk_data =
          BackingData.UserSettings.load(user)
          ++
          BackingData.CustomStatus.load(user)

        {bulk_data, topic}

      {:error, :not_found} ->
        {[], topic}
    end
  end

  defmodule BackingData do
    defmodule CustomStatus do
      def load(user) do
        case Presence.user_persistent_presences(user, "customStatus") do

          [] -> []

          presences ->
            presence = hd(presences)
            expires_in = if presence && presence.expires_at do
              Timex.to_unix(presence.expires_at) - Timex.to_unix(Timex.now())
            end

            history = Enum.map(presences, fn p -> p.data end)

            # {key, {value, ttl}, current time}
            if expires_in != nil && expires_in > 0 do
              [{"custom_status", {presence.data, expires_in * 1000}, Topic.server_ts()},
                {"custom_status_history", {history, nil}, Topic.server_ts()}]
            else
              [{"custom_status_history", {history, nil}, Topic.server_ts()}]
            end
        end

      end
    end

    defmodule UserSettings do
      def load(user) do
        Users.get_all_user_data(user)
        |> Enum.map(fn %UserData{key: key, value: value} ->
            {key, {value, nil}, Topic.server_ts()}
        end)
      end
    end

  end

end
