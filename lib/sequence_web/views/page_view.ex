defmodule SequenceWeb.PageView do
  use SequenceWeb, :view

  def js_path(conn, path) do
    Routes.static_path(conn, path)
  #   cond do
  #     Sequence.dev? or Sequence.test? ->
  #       if Application.get_env(:sequence, :serve_static) do
  #       else
  #         port = if Sequence.test?, do: 9002, else: 9000
  #         "http://#{conn.host}:#{port}" <> path
  #       end
  #     true -> Routes.static_path(conn, path)
  #   end
  end
end
