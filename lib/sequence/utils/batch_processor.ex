# BatchProcessor
# processes requests in batch
# you must define @timeout, @size, and a send_api(requests) function
# inspired by: https://stackoverflow.com/questions/52570520/how-create-batch-process-in-requests-elixir-phoenix

# defmodule ExampleProcessor do
#   @timeout 5_000
#   @size 10
#   use Sequence.BatchProcessor
#
#   defp send_api(requests) do
#     IO.puts "sending #{length requests} requests"
#   end
# end
defmodule Sequence.BatchProcessor do
  defmacro __using__(_opts) do
    quote do
      use GenServer

      @name __MODULE__

      def start_link(args \\ []) do
        GenServer.start_link(__MODULE__, args, name: @name)
      end

      def request(req) do
        GenServer.cast(@name, {:request, req})
      end

      def init(_) do
        {:ok, %{timer_ref: nil, requests: []}}
      end

      def handle_cast({:request, req}, state) do
        {:noreply, state |> update_in([:requests], & [req | &1]) |> handle_request()}
      end

      def handle_info(:timeout, state) do
        # sent to another API
        send_api(state.requests)
        {:noreply, reset_requests(state)}
      end

      def handle_info(_, state) do
        # ignore
        {:noreply, state}
      end

      defp handle_request(%{requests: requests} = state) when length(requests) == 1 do
        start_timer(state)
      end

      defp handle_request(%{requests: requests} = state) when length(requests) > @size do
        # sent to another API
        send_api(requests)
        reset_requests(state)
      end

      defp handle_request(state) do
        state
      end

      defp reset_requests(state) do
        state
        |> Map.put(:requests, [])
        |> cancel_timer()
      end

      defp start_timer(state) do
        timer_ref = Process.send_after(self(), :timeout, @timeout)
        state
        |> cancel_timer()
        |> Map.put(:timer_ref, timer_ref)
      end

      defp cancel_timer(%{timer_ref: nil} = state) do
        state
      end

      defp cancel_timer(%{timer_ref: timer_ref} = state) do
        Process.cancel_timer(timer_ref)
        Map.put(state, :timer_ref, nil)
      end
    end
  end
end
