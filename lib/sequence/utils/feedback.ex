defmodule Sequence.Feedback do
  @config_table :docdata
  @tandem_team "531b4ac3-ee41-4b6f-a211-a90ce56756de"
  @tandem_users [
    # bernat
    "4ce3b72a-5563-4d79-b50c-45d5b8ab5654",
    # rajiv
    "e51e4d32-9eab-46da-8246-a570962622cc"
  ]

  alias Sequence.{Cache, Utils}

  def show_feedback?(team_uuid) do
    if Cache.get(@config_table, "feedback:#{team_uuid}"), do: tandem_team_online?(), else: false
  end

  def feedback_on?(team_uuid) do
    Cache.get(@config_table, "feedback:#{team_uuid}") == true
  end

  def set_feedback(team_uuid, state) do
    Cache.set(@config_table, "feedback:#{team_uuid}", state)
    broadcast_feedback(team_uuid, state && tandem_team_online?())

    all_teams = Cache.get(@config_table, "feedback_teams") || MapSet.new()

    all_teams =
      if state, do: MapSet.put(all_teams, team_uuid), else: MapSet.delete(all_teams, team_uuid)

    Cache.set(@config_table, "feedback_teams", all_teams)
  end

  def tandem_team_online?() do
    if Sequence.dev?() do
      true
    else
      users = Utils.user_map(@tandem_team)
      Enum.find(@tandem_users, fn u -> Map.has_key?(users, u) end)
    end
  end

  def team_presence_update(team_id, _user_id) do
    if team_id == @tandem_team do
      old_state = tandem_team_online?()

      spawn(fn ->
        Process.sleep(1000)
        new_state = tandem_team_online?()

        if old_state != new_state do
          all_teams = Cache.get(@config_table, "feedback_teams") || MapSet.new()

          Enum.each(all_teams, fn team_uuid ->
            broadcast_feedback(team_uuid, new_state)
          end)
        end
      end)
    end
  end

  def broadcast_feedback(team_uuid, state),
    do: SequenceWeb.Endpoint.broadcast("team:#{team_uuid}", "show_feedback", %{on: state})
end
