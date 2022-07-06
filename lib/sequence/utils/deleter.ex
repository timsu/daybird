defmodule Sequence.Deleter do

  import Ecto.Query

  alias Sequence.{Repo, Users, Teams}

  def delete_user_helper(user) do
    Repo.transaction(fn ->
      _update = [set: [user_id: 0]]

      # for some tables, anonymize rather than delete
      Repo.update_all(from(o in Sequence.Teams.Team, where: o.creator_id == ^user.id), set: [creator_id: nil])
      Repo.update_all(from(o in Sequence.Chat.Message, where: o.sender_id == ^user.id), set: [sender_id: nil])
      Repo.update_all(from(o in Sequence.Billing.Subscription, where: o.user_id == ^user.id), set: [user_id: nil] )

      # for other tables, delete
      Repo.delete_all(from o in Sequence.Teams.UserTeam, where: o.user_id == ^user.id)
      Repo.delete_all(from o in Sequence.Invites.TeamInvite, where: o.user_id == ^user.id)
      Repo.delete_all(from o in Sequence.Chat.Unread, where: o.user_id == ^user.id)
      Repo.delete_all(from o in Sequence.Users.UserData, where: o.user_id == ^user.id)
      Repo.delete_all(from o in Sequence.Users.MagicLink, where: o.user_id == ^user.id)
      Repo.delete_all(from o in Sequence.Users.MagicLink, where: o.email == ^user.email)
      Repo.delete_all(from o in Sequence.Mobile.PushToken, where: o.user_id == ^user.id)

      # delete user
      Users.delete_user(user)
    end, [timeout: 120_000])

    SequenceWeb.Endpoint.broadcast("user:#{user.uuid}", "logout", %{})
  end

  def delete_team_helper(team) do
    Repo.transaction(fn ->
      _update = [set: [team_id: 0]]

      # for some tables, anonymize rather than delete

      # delete all chat messages
      Sequence.Chat.delete_all_chats(team, "CONFIRM")

      # for other tables, delete
      Repo.delete_all(from o in Sequence.Teams.UserTeam, where: o.team_id == ^team.id)
      Repo.delete_all(from o in Sequence.Chat.Unread, where: o.team_id == ^team.id)
      Repo.delete_all(from o in Sequence.Chat.Channel, where: o.team_id == ^team.id)
      Repo.delete_all(from o in Sequence.Users.UserData, where: o.team_id == ^team.id)
      Repo.delete_all(from o in Sequence.Billing.Subscription, where: o.team_id == ^team.id)

      # delete team
      Teams.delete_team(team)
    end, [timeout: 120_000])

    SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_team", %{})
  end

  def delete_org_helper(org) do
    Repo.transaction(fn ->
      update = [set: [org_id: 0]]
      Repo.update_all(from(o in Sequence.Teams.Team, where: o.org_id == ^org.id), update)

      # delete org
      Sequence.Orgs.delete_organization(org)
    end)
  end

end
