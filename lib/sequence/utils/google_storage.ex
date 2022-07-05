
defmodule Sequence.GoogleStorage do

  @project_id "tandem-276521"
  @url_expiry 60 * 60 # Possible this can be much shorter
  @tandem_telemetry_upload_bucket "tandem-telemetry-uploads"
  @tandem_telemetry_processed_bucket "tandem-telemetry-processed"
  @tandem_recording_prefix "tandem-recordings"

  alias GoogleApi.Storage.V1.{Model, Api}

  import Api.Buckets
  import Api.Objects

  @dialyzer {:nowarn_function, {:upload_for_processing, 2}}
  @dialyzer {:nowarn_function, {:upload_and_process_stats, 1}}

  def list_buckets(project_id \\ @project_id) do
    {:ok, response} = storage_buckets_list(get_conn(), project_id)
    response.items
  end

  def enabled?() do
    !Application.get_env(:goth, :disabled)
  end

  ### recording

  def signed_url_for_recording_clip(region, recording_uuid, stream_id, seq, mime_type \\ "video/webm") do
    case signed_url_load_config() do
      {:ok, client} ->
        file = recording_file_name(recording_uuid, stream_id, seq, mime_type)
        headers = ["Content-Type": mime_type]
        options = [verb: "PUT", headers: headers, expires: @url_expiry]
        {file, GcsSignedUrl.generate_v4(client, @tandem_recording_prefix <> region, file, options)}
      :disabled -> :disabled
    end
  end

  def recording_file_name(recording_uuid, stream_id, seq, mime_type) do
    ext1 = case mime_type do
      "audio/webm" -> ".webm"
      "video/webm" -> ".webm"
      _ -> raise "Unsupported Mime Type: #{mime_type}"
    end

    "#{recording_uuid}/#{stream_id}/#{seq}#{ext1}"
  end

  def signed_playback_url(region, file) do
    options = [verb: "GET", expires: @url_expiry]
    case signed_url_load_config() do
      {:ok, client} ->
        GcsSignedUrl.generate_v4(client, @tandem_recording_prefix <> region, file, options)
      :disabled -> ""
    end
  end

  ### telemetry

  def upload_bucket, do: @tandem_telemetry_upload_bucket
  def processed_bucket, do: @tandem_telemetry_processed_bucket

  def signed_url_for_telemetry_upload(call_uuid, user_uuid, seq, mime_type \\ "application/json",
      skip_gzip \\ false) do
    case signed_url_load_config() do
      {:ok, client} ->
        file = telemetry_file_name(call_uuid, user_uuid, seq, mime_type, "gzip")
        headers = if skip_gzip do
          ["Content-Type": mime_type]
        else
          ["Content-Type": mime_type, "Content-Encoding": "gzip"]
        end
        options = [verb: "PUT", headers: headers, expires: @url_expiry]
        {file, GcsSignedUrl.generate_v4(client, @tandem_telemetry_upload_bucket, file, options)}
      :disabled -> :disabled
    end
  end

  @spec upload_and_process_stats([ExNdjson.t()]) :: {:ok, Model.Object.t()} | {:error, any}
  def upload_and_process_stats(stats) do

    %{ "local_id" => user_uuid, "call_id" => call_uuid, "timestamp" => timestamp } = List.first(stats)
    timestamp = case timestamp do
      timestamp when is_number(timestamp) -> timestamp
      timestamp when is_binary(timestamp) ->
        case Timex.parse(timestamp, "{ISO:Extended:Z}") do
          {:ok, datetime} -> Timex.to_unix(datetime)
          _ -> Timex.to_unix(Timex.now())
        end
    end

    file = telemetry_file_name(call_uuid, user_uuid, timestamp, "application/x-ndjson", nil)

    resp = stats
    |> to_ndjson()
    |> upload_for_processing(file)

    with {:ok, %Model.Object{ contentType: "application/x-ndjson" }} <- resp do
      conn = get_conn()

      # Look to see if we have a consolidated file already so we can set the generation
      # and prevent race conditions
      consolidated_file = telemetry_consolidated_file_name(call_uuid, user_uuid)
      new_file_source_object = %Model.ComposeRequestSourceObjects{ name: file }

      {generation, source_objects} = case storage_objects_get(conn, @tandem_telemetry_processed_bucket, consolidated_file) do
        {:ok, %Model.Object{contentType: "application/x-ndjson", generation: generation}} ->
          { generation, [%Model.ComposeRequestSourceObjects{ name: consolidated_file }, new_file_source_object] }
        _ -> { 0, [new_file_source_object] } # 0 means this MUST be a new consolidated file
      end

      # Compose the new file onto the consolidated file, or create the consolidated file if it doesn't exist
      resp = storage_objects_compose(
        conn,
        @tandem_telemetry_processed_bucket,
        consolidated_file,
        ifGenerationMatch: generation,
        body: %Model.ComposeRequest{
          destination: %Model.Object{
            name: consolidated_file,
            contentType: "application/x-ndjson"
          },
          sourceObjects: source_objects
        }
      )
      storage_objects_delete(conn, @tandem_telemetry_processed_bucket, file)
      resp
    else
      {:ok, _} -> {:error, :unknown}
      error -> error
    end
  end

  defp to_ndjson(array) do
    array
    |> Enum.map(&Jason.encode!/1)
    |> Enum.concat([""])
    |> Enum.join("\n")
  end

  defp upload_for_processing(ndjson, file) do

    tmp_filename = Path.join(System.tmp_dir!(), String.replace(file, "/", "."))

    File.open! tmp_filename, [:write, :utf8], fn tmpfile ->
      IO.write(tmpfile, ndjson)
    end

    conn = get_conn()
    resp = storage_objects_insert_simple(
      conn,
      @tandem_telemetry_processed_bucket,
      "multipart",
      %Model.Object{ name: file, contentType: "application/x-ndjson" },
      tmp_filename
    )

    File.rm(tmp_filename)

    resp
  end

  def list_files_by_call(call_uuid, bucket \\ @tandem_telemetry_processed_bucket) do
    paginated_object_list(get_conn(), bucket, prefix: call_uuid)
  end

  def list_files_by_call_and_user(call_uuid, user_uuid, bucket \\ @tandem_telemetry_processed_bucket) do
    paginated_object_list(get_conn(), bucket, prefix: telemetry_file_prefix(call_uuid, user_uuid))
  end

  def list_users_by_call(call_uuid, bucket \\ @tandem_telemetry_processed_bucket) do
    call_prefix = "#{call_uuid}/"

    paginated_prefix_list(get_conn(), bucket, prefix: call_prefix, delimiter: "/")
    |> Stream.map(fn user_uuid -> String.replace_prefix(user_uuid, call_prefix, "") end)
    |> Stream.map(fn user_uuid -> String.replace_trailing(user_uuid, "/", "") end)
    |> Enum.to_list()
  end
  def list_consolidated_file_signed_urls_by_call(call_uuid) do
    case signed_url_load_config() do

      {:ok, client} ->

        call_uuid
        |> list_users_by_call()
        |> Enum.map(&signed_consolidated_file_url(client, call_uuid, &1))
        |> Enum.into(%{})

      :disabled -> :disabled
    end
  end

  defp signed_consolidated_file_url(client, call_uuid, user_uuid) do
    file = telemetry_consolidated_file_name(call_uuid, user_uuid)
    options = [verb: "GET", expires: @url_expiry]
    {user_uuid, GcsSignedUrl.generate_v4(client, @tandem_telemetry_processed_bucket, file, options)}
  end

  defp paginated_object_list(conn, bucket, params, page_token \\ nil) do
    case storage_objects_list(conn, bucket, params ++ [pageToken: page_token]) do
      {:ok, %Model.Objects{items: items, nextPageToken: page_token}} when not is_nil(page_token) ->
        items ++ paginated_object_list(conn, bucket, params, page_token)
      {:ok, %Model.Objects{items: items}} when is_list(items) ->
        items
      _ -> []
    end
  end

  defp paginated_prefix_list(conn, bucket, params, page_token \\ nil) do
    case storage_objects_list(conn, bucket, params ++ [pageToken: page_token]) do
      {:ok, %Model.Objects{prefixes: prefixes, nextPageToken: page_token}} when not is_nil(prefixes) and not is_nil(page_token) ->
        prefixes ++ paginated_prefix_list(conn, bucket, params, page_token)
      {:ok, %Model.Objects{prefixes: prefixes}} when not is_nil(prefixes) ->
        prefixes
      _ -> []
    end
  end

  # Note that because of how GCS works with Content-Encoding: gzip, this will work with both gzipped data
  # and non-gzipped data remotely, returning non-gzipped data either way
  def download_telemetry_file(file) do
    {:ok, %Model.Object{contentType: content_type, mediaLink: media_link}} = storage_objects_get(get_conn(), @tandem_telemetry_upload_bucket, file)
    {:ok, %Mojito.Response{ body: body}} = Mojito.get(media_link, [{"Authorization", "Bearer #{get_token()}"}])
    {content_type, body}
  end

  defp telemetry_file_prefix(call_uuid, user_uuid) do
    "#{call_uuid}/#{user_uuid}"
  end

  def telemetry_file_name(call_uuid, user_uuid, seq, mime_type, encoding) do
    ext1 = case mime_type do
      "application/json" -> ".json"
      "application/x-ndjson" -> ".ndjson"
      _ -> raise "Unsupported Mime Type: #{mime_type}"
    end

    ext2 = case encoding do
      "gzip" -> ".gz"
      _ -> ""
    end

    "#{telemetry_file_prefix(call_uuid, user_uuid)}/#{seq}#{ext1}#{ext2}"
  end

  def telemetry_consolidated_file_name(call_uuid, user_uuid) do
    "#{telemetry_file_prefix(call_uuid, user_uuid)}/consolidated.ndjson"
  end


  defp signed_url_load_config do
    if Sequence.GoogleStorage.enabled? do
      service_account = Application.get_env(:goth, :json) |> Jason.decode!
      {:ok, GcsSignedUrl.Client.load(service_account)}
    else
      :disabled
    end
  end

  defp get_conn() do
    GoogleApi.Storage.V1.Connection.new(get_token())
  end

  defp get_token() do
    {:ok, token} = Goth.Token.for_scope("https://www.googleapis.com/auth/cloud-platform")
    token.token
  end

end
