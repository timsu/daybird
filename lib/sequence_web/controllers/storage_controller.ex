defmodule SequenceWeb.StorageController do
  use SequenceWeb, :controller
  require Logger

  alias ExAws.S3
  alias Sequence.{Attachments, Projects}
  alias Sequence.Users.{Avatar, User}

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Users}

  @attachment_bucket "listnote-uploads"

  def upload_profile_picture(conn, %{ "upload" => upload, "token" => token } = params) do
    with {:ok, user, _} <- Sequence.Auth.Guardian.resource_from_token(token) do
      scope = {user, Timex.now |> Timex.to_unix |> Integer.to_string}
      with {:ok, file_name} <- Avatar.store({upload, scope}),
           {:ok, _user} <- Users.update_user(user, %{ profile_img: Avatar.url({file_name, scope}, :thumb) }) do

        if params["team"], do: SequenceWeb.Endpoint.broadcast("team:#{params["team"]}", "update_members", %{})
        json conn, %{
          name: file_name,
          url: Avatar.url({file_name, scope}),
          thumb: Avatar.url({file_name, scope}, :thumb),
        }
      else
        error ->
          {:error, :bad_request, "Error uploading profile image: #{inspect(error)}"}
        end
    end
  end

  def upload_profile_picture(conn, %{ "upload" => upload }) do
    with user <- Guardian.Plug.current_resource(conn) do
      scope = {user, Timex.now |> Timex.to_unix |> Integer.to_string}
      with {:ok, file_name} <- Avatar.store({upload, scope}),
           {:ok, user} <- Users.update_user(user, %{ profile_img: Avatar.url({file_name, scope}, :thumb) }) do

        team_uuid = Map.get(user.meta || %{}, User.meta_last_team)
        unless is_nil(team_uuid) do SequenceWeb.Endpoint.broadcast("team:#{team_uuid}", "update_members", %{}) end

        put_view(conn, SequenceWeb.AuthView) |> render("user.json", user: user)
      else
        {:error, :invalid_file} -> {:error, :bad_request, "Image type unsupported."}
        error ->
          {:error, :bad_request, "Error uploading profile image: #{inspect(error)}"}
      end
    end
  end

  def upload_profile_picture(_conn, _) do
    {:error, :bad_request}
  end

  ###

  def upload_attachment(conn, %{ "upload" => upload, "token" => token, "project_id" => project_uuid }) do
    with {:ok, user, _} <- Sequence.Auth.Guardian.resource_from_token(token),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do
      timestamp = Timex.now |> Timex.to_unix |> Integer.to_string
      path = "attachments/#{user.uuid}/#{timestamp}"
      %{size: size} = File.stat! upload.path

      result = upload.path
      |> S3.Upload.stream_file()
      |> S3.upload(@attachment_bucket, path)
      |> ExAws.request()

      with {:ok, _} <- result,
           {:ok, _} <- Attachments.create_attachment(%{
             user_id: user.id,
             project_id: project.id,
             filename: upload.filename,
             path: path,
             size: size
           }) do
        json conn, %{ url: "/api/v1/" <> path }
      else
        {:error, cause} -> {:error, :bad_request, inspect(cause)}
      end
    end
  end

  # GET /attachment
  def get_attachment(conn, %{ "user_id" => user_id, "timestamp" => timestamp }) do
    filename = "attachments/#{user_id}/#{timestamp}"

    {:ok, url} = ExAws.Config.new(:s3)
    |> ExAws.S3.presigned_url(:get, @attachment_bucket, filename, [virtual_host: true])

    redirect conn, external: url
  end

end
