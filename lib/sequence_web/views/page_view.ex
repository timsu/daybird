defmodule SequenceWeb.PageView do
  use SequenceWeb, :view

  def js_path(conn, entry) do
    cond do
      Sequence.dev? or Sequence.test? ->
        if Application.get_env(:sequence, :serve_static) do
          Routes.static_path(conn, "/js/#{entry}.js")
        else
          port = 3000
          "http://#{conn.host}:#{port}/src/#{entry}.tsx"
        end
      true -> Routes.static_path(conn, "/js/#{entry}.js")
    end
  end

end
