defmodule Sequence.ProjectsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Sequence.Projects` context.
  """

  @doc """
  Generate a project.
  """
  def project_fixture(attrs \\ %{}) do
    {:ok, project} =
      attrs
      |> Enum.into(%{
        archived_at: ~U[2022-07-13 06:12:00Z],
        meta: %{},
        name: "some name"
      })
      |> Sequence.Projects.create_project()

    project
  end
end
