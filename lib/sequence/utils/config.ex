defmodule Sequence.Config do
  use GenServer
  require Logger

  def start_link do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    {:ok, %{}}
  end

  def get(key) do
    with {:ok, result} <- Redix.command(:redix, ["GET", "config:#{key}"]) do
      result
    else
      {:error, error} ->
        Logger.info("config redix error: #{inspect error}")
        nil
    end
  end

  def get_json(key) do
    case get(key) do
      str when is_binary(str) -> Poison.decode!(str)
      other -> other
    end
  end

  def set(key, value, expiry_secs \\ nil) do
    if expiry_secs do
      Redix.command(:redix, ["SET", "config:#{key}", value, "EX", expiry_secs])
    else
      Redix.command(:redix, ["SET", "config:#{key}", value])
    end
    value
  end

  @spec set_json(any, any, any) :: any
  def set_json(key, value, expiry_secs \\ nil) do
    str = Poison.encode!(value)
    set(key, str, expiry_secs)
  end

end
