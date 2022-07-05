defmodule Sequence.Topicflow.Session.Supervisor do
  use DynamicSupervisor

  alias Sequence.Topicflow.Session

  def start_link(args) do
    DynamicSupervisor.start_link(__MODULE__, args, name: __MODULE__)
  end

  def start_child(user, team, client_id, state_id, socket_pid) do
    r =
      DynamicSupervisor.start_child(
        __MODULE__,
        Session.child_spec(
          user: user,
          team: team,
          client_id: client_id,
          state_id: state_id,
          socket_pid: socket_pid
        )
      )

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
