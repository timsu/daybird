defmodule Sequence.Chat.Attachment do
  use Arc.Definition

  @versions [:original]
  @acl false

  def s3_object_headers(_version, {file, _scope}) do
    [content_type: MIME.from_path(file.file_name)]
  end

  def gcs_object_headers(_version, {file, _scope}) do
    [content_type: MIME.from_path(file.file_name)]
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

end
