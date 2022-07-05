defmodule SequenceWeb.InvitesView do
  use SequenceWeb, :view

  alias SequenceWeb.TeamsView
  alias Sequence.Teams

  def render("invite_v3.json", %{invite: invite, team: team, recent_team_joins: recent_team_joins}) do
    allow_ext = Teams.allow_external(team)
    %{
      team: TeamsView.render_team_list(team),
      role: invite.role,
      inviting_user: render_user(invite.user),
      recent_team_joins: recent_team_joins |> Enum.map(&render_user/1),
      slack_team_id: invite.slack_team_id,
      no_slack: !allow_ext
    }
  end

  defp render_user(user) do
    if user do
      %{ profile_img: user.profile_img, name: user.name, nickname: user.nickname }
    end
  end


end
