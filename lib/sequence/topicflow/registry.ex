defmodule Sequence.Topicflow.Registry do
  def register_name(name, pid) do
    :ok = :pg.join(:topicflow_pg, name, pid)
    :yes
  end

  def unregister_name(name) do
    :pg.leave(:topicflow_pg, name, :pg.get_members(:topicflow, name))
  end

  def whereis_name(name) do
    case :pg.get_members(:topicflow_pg, name) do
      [pid | _] -> pid
      _ -> :undefined
    end
  end

  def send(name, msg) do
    case whereis_name(name) do
      :undefined ->
        throw({:badarg, {name, msg}})

      pid ->
        Kernel.send(pid, msg)
        pid
    end
  end

  def send_if_present(name, msg) do
    case whereis_name(name) do
      :undefined ->
        nil

      pid ->
        Kernel.send(pid, msg)
        pid
    end
  end

  def exit_non_unique do
    :pg.which_groups(:topicflow_pg)
    |> Enum.reduce([], fn id, acc ->
      case :pg.get_members(:topicflow_pg, id) do
        [_ | pids] -> [pids | acc]
        _ -> acc
      end
    end)
    |> Enum.concat()
    |> log_stats()
    |> Enum.each(&:erlang.exit(&1, :stop))
  end

  def kill_topic(name) do
    case whereis_name(name) do
      :undefined ->
        nil

      pid ->
        :erlang.exit(pid, :stop)
    end
  end

  def list_known_names() do
    :pg.which_groups(:topicflow_pg)
    |> Enum.filter(&is_topic/1)
    |> Enum.sort()
  end

  def inspect(name) do
    case whereis_name(name) do
      :undefined ->
        nil

      pid ->
        GenServer.call(pid, :inspect)
    end
  end

  defp log_stats(pids) do
    pids
  end

  def is_topic(topic_name) do
    prefix = topic_name
    |> String.split(":")
    |> Enum.at(0)
    |> Integer.parse()

    case prefix do
      {_, ""} -> false
      _ -> true
    end
  end

end
