defmodule Sequence.AttachmentsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Sequence.Attachments` context.
  """

  @doc """
  Generate a attachment.
  """
  def attachment_fixture(attrs \\ %{}) do
    {:ok, attachment} =
      attrs
      |> Enum.into(%{
        filename: "some filename",
        path: "some path",
        size: 42,
        uuid: "7488a646-e31f-11e4-aace-600308960662",
        project_id: 1,
        user_id: 1
      })
      |> Sequence.Attachments.create_attachment()

    attachment
  end
end
