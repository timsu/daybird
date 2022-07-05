defmodule SequenceWeb.TeamsView do
  use SequenceWeb, :view

  def render_team_list(team, org \\ nil) do
    %{
      id: team.uuid,
      name: team.name,
      presence: Map.get(team, :presence),
      role: Map.get(team, :role),
      meta: team.meta,
      integrations: render_integrations(team),
      user_team_meta: Map.get(team, :user_team_meta)
    }
    |> Map.merge(if org, do: %{ org: render_team_org(team, org) }, else: %{})
  end

  def render_team(team, org \\ nil) do
    %{
      id: team.uuid,
      name: team.name,
      members: team.members,
      last_doc: Map.get(team, :last_doc),
      user_team_meta: Map.get(team, :user_team_meta),
      async: team.async,
      presence: Map.get(team, :presence),
      role: Map.get(team, :role),
      meta: team.meta,
      integrations: render_integrations(team)
    }
    |> Map.merge(if org, do: %{ org: render_team_org(team, org) }, else: %{})
  end

  def render_integrations(team) do
    if team |> Map.has_key?(:slack_team) && team.slack_team do
      %{ slack: render_slack_team(team.slack_team) }
    else
      %{}
    end
  end

  def render_slack_team(slack_team) do
    slack_team && %{
        id: slack_team.id,
        name: slack_team.name,
        icon: slack_team.icon,
        teamId: slack_team.team_id
    }
  end

  def render_bucket(bucket) do
    %{
      id: bucket.test,
      variant: bucket.variant,
    }
  end

  def render_team_org(team, org) do
    if !org || team.org_id != org.id, do: nil, else: render_org(org)
  end

  def render_org(nil), do: nil

  def render_org(org) do
    %{
      id: org.uuid,
      name: org.name,
      domain: org.domain
    }
  end

  def render_room(room) do
    %{
      id: room.uuid,
      name: room.name,
      type: room.type,
    }
  end

  def render("list.json", %{user: user, teams: teams, primary: primary, org: org} = params) do
    %{
      user: SequenceWeb.AuthView.render_user(user),
      teams: teams |> Enum.map(&render_team_list(&1, org)),
      primary_team: if(primary, do: render_team(primary, org), else: nil),
      org: render_org(org),
      rooms: if(params[:rooms], do: params[:rooms] |> Enum.map(&render_room(&1))),
    }
  end

  def render("get.json", %{team: team, org: org}) do
    %{
      team: render_team(team, org)
    }
  end

  def render("invite.json", %{team: team, role: role, token: token, doc: doc}) do
    %{
      team: render_team(team),
      role: role,
      token: token,
      doc: doc,
    }
  end

  def render("buckets.json", %{buckets: buckets}) do
    %{
      buckets: buckets |> Enum.map(&render_bucket(&1)),
    }
  end

end
