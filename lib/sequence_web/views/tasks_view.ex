
defmodule SequenceWeb.TasksView do
  use SequenceWeb, :view

  def render_task(task) do
    %{
      id: Sequence.Utils.no_dash(task.uuid),
      title: task.title,
      doc: task.doc,
      short_code: task.short_code,
      completed_at: task.completed_at,
      archived_at: task.archived_at,
      deleted_at: task.deleted_at
    }
  end

  def render("list.json", %{tasks: tasks}) do
    %{
      tasks: tasks |> Enum.map(&render_task(&1)),
    }
  end

  def render("get.json", %{task: task}) do
    %{
      task: render_task(task)
    }
  end

end
