defmodule SequenceWeb.AuthView do
  use SequenceWeb, :view

  def render_user(user) do
    %{
      id: user.uuid,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      profile_img: user.profile_img,
      meta: user.meta,
      timezone: user.timezone,
    }
  end

  def render("token.json", params) do
    %{
      success: (if Map.has_key?(params, :success), do: params[:success], else: true),
      token: params[:token],
      team: params[:team] && %{id: params[:team].uuid},
      domainTeams: params[:domain_teams],
      existing: params[:existing],
      user: render_user(params[:user]),
      no_team: params[:no_team],
      guest: params[:guest],
    }
  end

  def render("user.json", %{user: user}) do
    %{
      user: render_user(user)
    }
  end
end
