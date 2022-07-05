defmodule Sequence.Utils.Sourcemaps do

  # see https://docs.appsignal.com/api/sourcemaps.html
  def upload_sourcemaps() do
    appsignal_config = Application.get_env(:appsignal, :config)
    push_key = appsignal_config.push_api_key
    revision = appsignal_config.revision

    js_path = Path.join(:code.priv_dir(:sequence), "static/js")

    {:ok, files} = File.ls(js_path)
    js_files = Enum.filter(files, fn file -> String.ends_with?(file, ".js") end)

    Enum.each(js_files, fn file ->
      source_map_file = Regex.replace(~r/-[^.]+.js/, file, ".js.map")
      source_map_path = Path.join(String.replace(js_path, "js", "sourcemaps"), source_map_file)

      if File.exists?(source_map_path) do
        form = [
          {:file, source_map_path},
          {"name[]", Sequence.base_url <> "/js/" <> file},
          {"name[]", Sequence.base_url <> "/js/" <> file <> "?vsn=d"},
          {"revision", revision}
        ]
        env = Sequence.env
        url = "https://appsignal.com/api/sourcemaps?push_api_key=#{push_key}&app_name=Wisp&environment=#{env}"

        spawn fn ->
          HTTPoison.post(url, {:multipart, form})
        end
      end
    end)
  end


end
