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
        date: "some date",
        snippet: "some snippet",
        uuid: "7488a646-e31f-11e4-aace-600308960662"
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
        date: "some date",
        snippet: "some snippet",
        type: "some type",
        uuid: "7488a646-e31f-11e4-aace-600308960662"
      })
      |> Sequence.Journal.create_summary()

    summary
  end
end
