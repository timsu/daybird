defmodule SequenceWeb.StorageController do
  use SequenceWeb, :controller
  require Logger

  alias ExAws.S3
  alias Sequence.Users.{Avatar, User}
  alias Sequence.StorageController.StorageError

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Users}

  # upload profile picture via HTML post
  def upload_profile_picture(conn, %{ "upload" => upload, "token" => token, "redirect" => redirect } = params) do
    with {:ok, user, _} <- Sequence.Auth.Guardian.resource_from_token(token) do
      scope = {user, Timex.now |> Timex.to_unix |> Integer.to_string}
      with {:ok, file_name} <- Avatar.store({upload, scope}),
           {:ok, _user} <- Users.update_user(user, %{ profile_img: Avatar.url({file_name, scope}, :thumb) }) do

        if params["team"], do: SequenceWeb.Endpoint.broadcast("team:#{params["team"]}", "update_members", %{})
        redirect conn, external: redirect
      else
        error ->
          raise StorageError, message: "Error uploading profile image: #{inspect(error)}"
        end
    end
  end

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
          raise StorageError, message: "Error uploading profile image: #{inspect(error)}"
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
          raise StorageError, message: "Error uploading profile image: #{inspect(error)}"
      end
    end
  end

  def upload_profile_picture(_conn, _) do
    {:error, :bad_request}
  end

  def upload_attachment(conn, %{ "upload" => upload, "token" => token }) do
    with {:ok, user, _} <- Sequence.Auth.Guardian.resource_from_token(token) do
      timestamp = Timex.now |> Timex.to_unix |> Integer.to_string
      filename = "attachments/#{user.uuid}/#{timestamp}"

      upload.path
      |> S3.Upload.stream_file()
      |> S3.upload("listnote-uploads", filename)
      |> ExAws.request()

      {:ok, url} = ExAws.Config.new(:s3)
      |> ExAws.S3.presigned_url(:get, "listnote-uploads", filename, [virtual_host: true])

      json conn, %{ url: url }
    end
  end

  def upload_attachment(conn, _) do
    json conn, %{}
  end

  # POST /logs/user
  def send_user_log(conn, _) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do
      [date, time] = Timex.now
      |> DateTime.to_iso8601
      |> String.split("T")

      path = "#{user.uuid}/#{date}/#{time}"
      {:ok, url} = ExAws.Config.new(:s3) |> ExAws.S3.presigned_url(:put, "tandem-user-logs", path,
        query_params: [{"x-amz-storage-class", "ONEZONE_IA"}])
      json conn, %{url: url, path: path }
    else
      nil -> {:error, :unauthorized}
    end
  end

end

defmodule Sequence.StorageController.StorageError do
  defexception reason: "Unknown upload error", message: nil
end
