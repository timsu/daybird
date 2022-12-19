defmodule Sequence.JournalFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Sequence.Journal` context.
  """

  @doc """
  Generate a daily_note.
  """
  def daily_note_fixture(attrs \\ %{}) do
    {:ok, daily_note} =
      attrs
      |> Enum.into(%{
        type: "type",
        date: "2022-01-01",
        snippet: "some snippet",
        project_id: 1,
        creator_id: 1
      })
      |> Sequence.Journal.create_daily_note()

    daily_note
  end


  @doc """
  Generate a streak.
  """
  def streak_fixture(attrs \\ %{}) do
    {:ok, streak} =
      attrs
      |> Enum.into(%{
        current: 42,
        date: "some date",
        longest: 42
      })
      |> Sequence.Journal.create_streak()

    streak
  end
end
