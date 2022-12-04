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
        date: "2022-01-01",
        snippet: "some snippet",
        project_id: 1,
        creator_id: 1
      })
      |> Sequence.Journal.create_daily_note()

    daily_note
  end

  @doc """
  Generate a summary.
  """
  def summary_fixture(attrs \\ %{}) do
    {:ok, summary} =
      attrs
      |> Enum.into(%{
        date: "2020-W05",
        snippet: "some snippet",
        type: "week",
        project_id: 1,
        creator_id: 1
      })
      |> Sequence.Journal.create_summary()

    summary
  end
end
