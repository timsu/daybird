defmodule Sequence.Topicflow.Test.PersistentTopic do
  def make_epoch, do: "test"

  def init(id) do
    if String.contains?(id, ":invalid") do
      {:error, :invalid_id}
    else
      {:ok, nil}
    end
  end

  def retrieve_shared_bulk(state) do
    {[{"foo", {"bar", nil}, 0}], state}
  end
end
