defmodule SequenceWeb.PageView do
  use SequenceWeb, :view

  alias Sequence.Cache

  @manifest_path "priv/static/manifest.json"

  def manifest_entry(src_file) do
    {:ok, manifest_file} = File.read @manifest_path
    {:ok, manifest} = Jason.decode manifest_file
    Map.get(manifest, src_file)
  end

  def manifest_path(conn, src_file) do
    case Cache.get(:config, src_file) do
      nil ->
        entry = manifest_entry(src_file)
        path = "/" <> Map.get(entry, "file")
        Cache.set(:config, src_file, path)
        Routes.static_path(conn, path)
      path -> Routes.static_path(conn, path)
    end
  end

  def js_path(conn, entry) do
    tsx_file = "src/#{entry}.tsx"
    cond do
      Sequence.dev? or Sequence.test? ->
        if Application.get_env(:sequence, :serve_static) do
          manifest_path(conn, tsx_file)
        else
          port = 3000
          "http://#{conn.host}:#{port}/#{tsx_file}"
        end
      true -> manifest_path(conn, tsx_file)
    end
  end

  def dev_server?() do
    (Sequence.dev? or Sequence.test?) && !Application.get_env(:sequence, :serve_static)
  end

end
