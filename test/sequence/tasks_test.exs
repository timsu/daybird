defmodule Sequence.TasksTest do
  use Sequence.DataCase

  alias Sequence.Tasks

  describe "tasks" do
    alias Sequence.Tasks.Task

    import Sequence.TasksFixtures

    @invalid_attrs %{completed_at: nil, deleted_at: nil, description: nil, short_code: nil, state: nil, title: nil}

    test "list_tasks/0 returns all tasks" do
      task = task_fixture()
      assert Tasks.list_tasks() == [task]
    end

    test "get_task!/1 returns the task with given id" do
      task = task_fixture()
      assert Tasks.get_task!(task.id) == task
    end

    test "create_task/1 with valid data creates a task" do
      valid_attrs = %{creator_id: 1, project_id: 1,
        description: "some description", short_code: "BL-1", state: "some state", title: "some title"}

      assert {:ok, %Task{} = task} = Tasks.create_task(valid_attrs)
      assert task.description == "some description"
      assert task.short_code == "BL-1"
      assert task.state == "some state"
      assert task.title == "some title"
    end

    test "create_task/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Tasks.create_task(@invalid_attrs)
    end

    test "update_task/2 with valid data updates the task" do
      task = task_fixture()
      update_attrs = %{completed_at: ~U[2022-07-14 06:23:00Z], deleted_at: ~U[2022-07-14 06:23:00Z],
        description: "some updated description", short_code: "BL-2",
        state: "some updated state", title: "some updated title"}

      assert {:ok, %Task{} = task} = Tasks.update_task(task, update_attrs)
      assert task.completed_at == ~U[2022-07-14 06:23:00Z]
      assert task.deleted_at == ~U[2022-07-14 06:23:00Z]
      assert task.description == "some updated description"
      assert task.short_code == "BL-2"
      assert task.state == "some updated state"
      assert task.title == "some updated title"
    end

    test "update_task/2 with invalid data returns error changeset" do
      task = task_fixture()
      assert {:error, %Ecto.Changeset{}} = Tasks.update_task(task, @invalid_attrs)
      assert task == Tasks.get_task!(task.id)
    end

    test "delete_task/1 deletes the task" do
      task = task_fixture()
      assert {:ok, %Task{}} = Tasks.delete_task(task)
      assert_raise Ecto.NoResultsError, fn -> Tasks.get_task!(task.id) end
    end

    test "change_task/1 returns a task changeset" do
      task = task_fixture()
      assert %Ecto.Changeset{} = Tasks.change_task(task)
    end
  end
end
