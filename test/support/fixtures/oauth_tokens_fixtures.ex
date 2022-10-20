defmodule Sequence.OAuthTokensFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Sequence.OAuthTokens` context.
  """

  @doc """
  Generate a oauth_token.
  """
  def oauth_token_fixture(attrs \\ %{}) do
    {:ok, oauth_token} =
      attrs
      |> Enum.into(%{
        access: "some access",
        expires_at: ~N[2022-10-19 23:40:00],
        meta: %{},
        name: "some name",
        refresh: "some refresh",
        user_id: 1
      })
      |> Sequence.OAuthTokens.create_oauth_token()

    oauth_token
  end
end
