defmodule Sequence.Chat.ImageAttachment do
  use Arc.Definition

  @versions [:original]
  @extension_whitelist ~w(.jpg .jpeg .gif .png .webp)
  @acl false

  def bucket, do: "listnote-uploads"

  def s3_object_headers(_version, {file, _scope}) do
    [content_type: MIME.from_path(file.file_name)]
  end

  def gcs_object_headers(_version, {file, _scope}) do
    [content_type: MIME.from_path(file.file_name)]
  end

  def validate({file, _}) do
    file_extension = file.file_name |> Path.extname |> String.downcase
    Enum.member?(@extension_whitelist, file_extension)
  end

  def valid_filename(filename) do
    file_extension = filename |> Path.extname |> String.downcase
    Enum.member?(@extension_whitelist, file_extension)
  end

  def transform(:thumb, _) do
    {:convert, "-thumbnail 200x200> -format png", :png}
  end

  def filename(version, {_, {_, timestamp}}) do
    "#{timestamp}_#{version}"
  end

  def storage_dir(_, {_, {user, _}}) when is_map(user) do
    "attachments/#{user.uuid}"
  end

  def storage_dir(_, {_, {user_uuid, _}}) when is_binary(user_uuid) do
    "attachments/#{user_uuid}"
  end

  def extract_info_from_url(url) do
    Regex.run(~r{/attachments/([^/]+)/([0-9]+)_original.([A-z]+)}, url)
  end

  def re_sign_url(bare_url, expires_in \\ 24 * 60 * 60) do
    with [_whole, uuid, timestamp, ext] <- extract_info_from_url(bare_url) do
      url({"anything.#{ext}", {uuid, timestamp}}, signed: true, expires_in: expires_in)
    else
      _ -> bare_url
    end
  end
end
