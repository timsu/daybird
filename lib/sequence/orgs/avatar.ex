defmodule Sequence.Orgs.Avatar do
  use Arc.Definition

  @versions [:original, :thumb]
  @extension_whitelist ~w(.jpg .jpeg .gif .png .webp)
  @acl false

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

  def transform(:thumb, _) do
    {:convert, "-thumbnail 256x256^ -gravity center -extent 256x256 -format png", :png}
  end

  def filename(:original, {file, {_, timestamp}}) do
    file_name = Path.basename(file.file_name, Path.extname(file.file_name))
    "#{timestamp}_original_#{file_name}"
  end

  def filename(version, {_, {_, timestamp}}) do
    "#{timestamp}_#{version}"
  end

  def storage_dir(_, {_, {org, _}}) do
    "orgs/#{org.uuid}"
  end

end
