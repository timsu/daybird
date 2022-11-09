defmodule SequenceWeb.ConfigController do
  use SequenceWeb, :controller

  action_fallback SequenceWeb.FallbackController

  def time(conn, _params) do
    json conn, %{ time: :os.system_time(:millisecond) }
  end

  def githash(conn, _params) do
    json conn, %{ hash: Application.get_env(:sequence, :githash) }
  end

end
