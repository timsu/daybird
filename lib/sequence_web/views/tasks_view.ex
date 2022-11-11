
defmodule SequenceWeb.TasksView do
  use SequenceWeb, :view

  alias Sequence.Utils

  def render_task(task) do
    %{
      id: Sequence.Utils.no_dash(task.uuid),
      title: task.title,
      doc: if(task.doc, do: Utils.no_dash(task.doc)),
      short_code: task.short_code,
      state: task.state,
      priority: task.priority,
      due_at: task.due_at,
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
