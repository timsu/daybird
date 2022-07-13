defmodule Sequence.Cache do
  use GenServer

  def start_link do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    :ets.new(:config, [:set, :public, :named_table])
    :ets.new(:docdata, [:set, :public, :named_table])
    :ets.new(:cache, [:set, :public, :named_table])
    {:ok, %{}}
  end

  def get(table, key) do
    data = :ets.lookup(table, key)
    if length(data) > 0, do: data |> hd |> elem(1), else: nil
  end

  def set(table, key, value) do
    :ets.insert(table, {key, value})
  end

  def delete(table, key) do
    :ets.delete(table, key)
  end
end
