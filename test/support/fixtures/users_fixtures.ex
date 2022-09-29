defmodule Sequence.UsersFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Sequence.Users` context.
  """

  @doc """
  Generate a user.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        name: "some name",
        email: "email@domain.com",
      })
      |> Sequence.Users.create_user()

    user
  end

end
