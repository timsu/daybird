defmodule Sequence.TasksFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Sequence.Tasks` context.
  """

  @doc """
  Generate a task.
  """
  def task_fixture(attrs \\ %{}) do
    {:ok, task} =
      attrs
      |> Enum.into(%{
        completed_at: ~U[2022-07-13 06:23:00Z],
        deleted_at: ~U[2022-07-13 06:23:00Z],
        description: "some description",
        short_id: 42,
        state: "some state",
        title: "some title",
        short_code: "T-1",
        creator_id: 1,
        project_id: 1
      })
      |> Sequence.Tasks.create_task()

    task
  end
end
