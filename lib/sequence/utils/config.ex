defmodule Sequence.Config do
  use GenServer
  require Logger

  @url_prefix "https://wisp-app.s3-accelerate.amazonaws.com/"
  @snap_url "https://snapcraft.io/tandem"

  @todesktop_json "http://download.todesktop.com/200527auaqaacsy/td-latest.json"
  @todesktop_staging_json "http://download.todesktop.com/200606cf26nnqzn/td-latest.json"
  @todesktop_url "https://downloads.tandem.chat/"

  @product_updates_key "product_updates"

  def start_link do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    reload()

    read_download_links()
    {:ok, %{}}
  end

  @spec reload :: false | nil | true | binary | [any] | number | map
  def reload do
    data = File.read!("config.json")
    |> Poison.decode!

    Enum.each(data, fn {k, v} ->
      set(k, Poison.encode!(v))
    end)
    data
  end

  def get_latest_version(force \\ false) do
    ver = if force, do: nil, else: get("latest_version")
    case ver do
      nil ->
        url = if Sequence.dogfood?, do: @todesktop_staging_json, else: @todesktop_json
        {:ok, %{body: body}} = Mojito.get(url)
        {:ok, decoded} = Poison.decode body
        ver = decoded["version"]
        set("latest_version", ver, 3600)
      ver -> ver
    end
  end

  def read_download_links do
    mac = {
      set("tandem_mac", @todesktop_url <> "mac/zip/x64"),
      set("tandem_mac_dmg", @todesktop_url <> "mac/dmg/x64"),
    }

    windows = {
      set("tandem_windows", @todesktop_url <> "windows/nsis/x64"),
      set("tandem_windows_msi", @todesktop_url <> "windows/msi/x64"),
      set("tandem_windows_32", @todesktop_url <> "windows/msi/ia32"),
    }

    linux = {
      set("tandem_linux", @snap_url),
      set("tandem_linux_deb", @todesktop_url <> "linux/deb/x64"),
      set("tandem_linux_rpm", @todesktop_url <> "linux/rpm/x64"),
    }

    {mac, windows, linux}
  end

  def get_s3_files do
    ex_aws = ExAws.Config.new(:s3)
    {:ok, %{ body: body }} = ExAws.S3.list_objects("wisp-app") |> ExAws.request(ex_aws)
    body.contents
  end

  def latest_file(items, extension, contains \\ nil) do
    item = Enum.filter(items, fn item ->
      String.ends_with?(item.key, extension) and
        (contains == nil or String.contains?(item.key, contains))
    end)
    |> Enum.max_by(fn item ->
      item.last_modified
    end)
    @url_prefix <> item.key
  end

  def read_builder_yaml(url) do
    case Mojito.get(@url_prefix <> url) do
      {:ok, %Mojito.Response{status_code: 200, body: body}} ->
        {:ok, data} = YamlElixir.read_from_string body
        files = data["files"]
        {:ok, files}
      _ -> :error
    end
  end

  def set_file(files, extension, key) do
    file = Enum.find(files, fn file -> String.contains?(file["url"], extension) end)
    if file do
      url = @url_prefix <> file["url"]
      if check_url(url) != :ok do
        raise "Invalid url: #{url}"
      end
      set(key, url)
    end
    file
  end

  def test_links do
    ["tandem_mac", "tandem_mac_dmg", "tandem_windows", "tandem_windows_msi", "tandem_windows_32", "tandem_linux",
      "tandem_linux_deb", "tandem_linux_rpm"]
    |> Enum.reduce(:ok, fn key, result ->
      if result != :ok do
        result
      else
        get(key) |> check_url()
      end
    end)
  end

  def check_url(url) do
    case Mojito.head(url) do
      {:ok, %Mojito.Response{status_code: 200}} ->
        :ok
      _ ->
        {:error, :bad_request, "Invalid url: #{url}"}
    end
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

  def product_updates(skip_cache \\ false) do
    cache_result = if skip_cache, do: {:ok, nil}, else: get(@product_updates_key)
    case cache_result do
      nil -> # cache miss
        key = Application.get_env(:sequence, :ghost_blog_key)
        if key do
          url = "https://tandem.ghost.io/ghost/api/v3/content/posts/?" <> URI.encode_query(%{
            key: key,
            filter: "tag:product-updates",
            fields: "title,published_at,url,excerpt",
            limit: 6
          })
          case Mojito.get(url) do
            {:ok, %Mojito.Response{body: body}} ->
              case Jason.decode(body) do
                {:ok, decoded} when is_map(decoded) ->
                  set(@product_updates_key, body, 8 * 3600)
                  decoded["posts"]
              end
            _ -> []
          end
        else
          []
        end
      result ->
        {:ok, decoded} = Jason.decode(result)
        decoded["posts"]
    end
  end

end
