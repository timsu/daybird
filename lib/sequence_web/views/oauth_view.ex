defmodule SequenceWeb.OAuthView do
  use SequenceWeb, :view

  def render_token(nil), do: nil

  def render_token(token) do
    %{
      name: token.name,
      access: token.access,
      expires_at: token.expires_at,
      meta: token.meta,
    }
  end

  def render("token.json", %{token: token}) do
    %{
      token: render_token(token),
    }
  end

  def render("tokens.json", %{tokens: tokens}) do
    %{
      tokens: tokens |> Enum.map(&render_token/1)
    }
  end

end
