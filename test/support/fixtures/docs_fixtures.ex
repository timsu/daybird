defmodule Sequence.DocsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Sequence.Docs` context.
  """

  @doc """
  Generate a doc.
  """
  def doc_fixture(attrs \\ %{}) do
    {:ok, doc} =
      attrs
      |> Enum.into(%{
        archived_at: ~U[2022-09-15 23:44:00Z],
        deleted_at: ~U[2022-09-15 23:44:00Z],
        name: "some name",
        type: 0,
        uuid: "7488a646-e31f-11e4-aace-600308960662",
        project_id: 1,
        creator_id: 1
      })
      |> Sequence.Docs.create_doc()

    doc
  end
end
