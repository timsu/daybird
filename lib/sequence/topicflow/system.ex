defmodule Sequence.Topicflow.System do
  def user_info_key, do: "user_info"
  def team_info_key, do: "team_info"
  def status_key, do: "status"
  def updated_key, do: "updated"
  def presence_keys, do: [user_info_key(), team_info_key(), status_key(), updated_key()]

  def presence_group(user, client_id), do: "p:#{user.uuid}:#{client_id}"
  def is_presence_group(group), do: String.starts_with?(group, "p:")

  # only these topics will get automatically broadcast user info & status
  def topics_with_presence() do
    ["rtc:", "cursor:", "test", "crosstalk:", "presence:"]
  end

  def send_presence(topic_id) do
    !!Enum.find(topics_with_presence(), fn prefix -> String.starts_with?(topic_id, prefix) end)
  end
end
