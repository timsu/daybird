defmodule Sequence.Topicflow.Topic.Supervisor do
  use DynamicSupervisor

  alias Sequence.Topicflow.Topic

  def start_link(args) do
    DynamicSupervisor.start_link(__MODULE__, args, name: __MODULE__)
  end

  def start_child(id) do
    r =
      DynamicSupervisor.start_child(
        __MODULE__,
        Topic.child_spec(id: id)
      )

    %{active: active} = DynamicSupervisor.count_children(__MODULE__)
    _ = Appsignal.set_gauge("topicflow.topic.count", active)

    r
  end

  @impl true
  def init(args) do
    DynamicSupervisor.init(
      strategy: :one_for_one,
      extra_arguments: [args]
    )
  end
end
