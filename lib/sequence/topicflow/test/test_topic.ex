defmodule Sequence.Topicflow.Test.TestTopic do
  def make_epoch, do: "test"

  def init(id) do
    if String.contains?(id, ":invalid") do
      {:error, :invalid_id}
    else
      {:ok, id}
    end
  end
end
