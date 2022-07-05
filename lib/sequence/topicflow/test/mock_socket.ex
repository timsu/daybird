defmodule Sequence.Topicflow.Test.MockSocket do
  alias Sequence.Topicflow.Session
  alias Sequence.Topicflow.JsonRpc
  alias Sequence.Repo

  def start(state_id, user, client_id) do
    start(state_id, user, nil, client_id)
  end

  def start(state_id, user, team, client_id) do
    task =
      Task.async(fn ->
        team =
          if team do
            team |> Repo.preload(:org)
          else
            team
          end

        session_pid =
          case Session.Supervisor.start_child(user, team, client_id, state_id, self()) do
            {:error, {:already_started, session_pid}} ->
              :ok = Session.cast_switch_socket(session_pid, user, team, state_id, self())
              session_pid

            {:ok, session_pid} ->
              session_pid
          end

        loop(session_pid, [])
      end)

    delay()
    task
  end

  def exit(%Task{pid: pid} = task) do
    _ = send(pid, :exit)
    messages = Task.await(task)
    delay()
    messages
  end

  def drain(%Task{pid: pid}) do
    _ = send(pid, :drain)
    delay()
    :ok
  end

  def ack_and_drain(%Task{pid: pid}) do
    _ = send(pid, :ack_and_drain)
    delay()
    :ok
  end

  def peek(%Task{pid: pid}) do
    ref = make_ref()
    _ = send(pid, {:peek, ref, self()})

    receive do
      {:messages, ^ref, messages} ->
        delay()
        messages
    end
  end

  def receive(%Task{pid: pid}, messages) do
    _ = send(pid, {:receive, messages})
    delay()
    :ok
  end

  def expire_and_exit(%Task{pid: pid} = task) do
    _ = send(pid, :expire_and_exit)
    messages = Task.await(task)
    delay()
    messages
  end

  defp delay do
    Process.sleep(25)
  end

  defp loop(session_pid, messages_acc) do
    receive do
      {:send_messages, messages, _max_wait} ->
        loop(session_pid, messages_acc ++ messages)

      :exit ->
        messages_acc

      :expire_and_exit ->
        _ = send(session_pid, :expire)
        messages_acc

      :drain ->
        loop(session_pid, [])

      {:peek, ref, caller_pid} ->
        _ = send(caller_pid, {:messages, ref, messages_acc})

        loop(session_pid, messages_acc)

      :ack_and_drain ->
        :ok =
          Session.cast_receive_messages(
            session_pid,
            messages_acc
            |> Enum.filter(fn message -> message.__struct__ == JsonRpc.Request end)
            |> Enum.map(fn request -> JsonRpc.make_success(request) end)
          )

        loop(session_pid, [])

      {:receive, messages} ->
        :ok =
          Session.cast_receive_messages(
            session_pid,
            messages
          )

        loop(session_pid, messages_acc)
    end
  end

  def kill_topic(id) do
    {:ok, pid} = Sequence.Topicflow.Topic.get_topic_pid(id)

    :erlang.exit(pid, :kill)
    Process.sleep(100)
    :ok
  end

  def force_conflict(id) do
    {:ok, pid} = Sequence.Topicflow.Topic.get_topic_pid(id)

    :ok = Sequence.Topicflow.Topic.cast_test_force_conflict(pid)
    Process.sleep(100)
    :ok
  end
end
