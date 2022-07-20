
defmodule SequenceWeb.TasksView do
  use SequenceWeb, :view

  def render_task(task) do
    %{
      id: task.uuid |> String.replace("-", ""),
      title: task.title,
      short_code: task.short_code
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