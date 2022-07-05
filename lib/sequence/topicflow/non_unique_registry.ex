defmodule Sequence.Topicflow.NonUniqueRegistry do
  def join(name, pid) do
    :pg.join(:topicflow_pg_non_unique, name, pid)
  end

  def send_all(name, msg) do
    Enum.each(:pg.get_members(:topicflow_pg_non_unique, name), &Kernel.send(&1, msg))
  end
end
