defmodule Sequence.Topicflow.Antientropy do
  use GenServer

  alias Sequence.Topicflow.Registry

  @check_period 60 * 1000

  def start_link([]) do
    GenServer.start_link(__MODULE__, nil)
  end

  # Callbacks

  @impl true
  def init(nil) do
    :ok = schedule_check()

    {:ok, nil}
  end

  @impl true
  def handle_info(:check, nil) do
    :ok = schedule_check()

    :ok = Registry.exit_non_unique()

    {:noreply, nil}
  end

  defp schedule_check do
    period = floor(@check_period * (:rand.uniform() + 1.0))
    _ = Process.send_after(self(), :check, period)
    :ok
  end
end
