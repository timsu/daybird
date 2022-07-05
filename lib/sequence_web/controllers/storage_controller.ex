defmodule SequenceWeb.StorageController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.Users.{Avatar, User}
  alias Sequence.{AppDataDefinitions.AppIcon, Chat.Attachment, Chat.ImageAttachment, Calls.VirtualBackground}
  alias Sequence.StorageController.StorageError

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Teams, Users}

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

  def upload_app_icon(conn, %{ "upload" => upload }) do
    with user <- Guardian.Plug.current_resource(conn) do
      scope = {user, Timex.now |> Timex.to_unix |> Integer.to_string}
      with {:ok, file_name} <- AppIcon.store({upload, scope}) do
        json conn, %{ url: AppIcon.url({file_name, scope}, :thumb) }

      else
        {:error, :invalid_file} -> {:error, :bad_request, "Image type unsupported."}
        error ->
          raise StorageError, message: "Error uploading app icon: #{inspect(error)}"
      end
    end
  end

  def upload_attachment(conn, %{ "upload" => upload, "token" => token }) do
    with {:ok, user, _} <- Sequence.Auth.Guardian.resource_from_token(token) do
      timestamp = Timex.now |> Timex.to_unix |> Integer.to_string
      scope = {user, timestamp}
      is_image = ImageAttachment.valid_filename(upload.filename)
      component = if is_image, do: ImageAttachment, else: Attachment
      %{size: size} = File.stat! upload.path

      with {:ok, file_name} <- component.store({upload, scope}) do
        json conn, %{
          name: file_name,
          timestamp: timestamp,
          type: upload.content_type,
          size: size,
          url: component.url({file_name, scope}, signed: true, expires_in: 24 * 60 * 60 ),
          thumb: if(is_image, do: ImageAttachment.url({file_name, scope}, :thumb, signed: true, expires_in: 24 * 60 * 60), else: nil),
          bare_url: component.url({file_name, scope}),
        }
      else
        {:error, :invalid_file} -> {:error, :bad_request, "File type unsupported."}
        error ->
          raise StorageError, message: "Error uploading attachment: #{inspect(error)}"
      end
    end
  end

  def upload_attachment(conn, _) do
    json conn, %{}
  end

  # POST /files/send
  def send_file(conn, %{ "user_id" => user_id, "team_id" => team_id, "channel_id" => channel_id,
      "description" => description }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, _} <- Teams.team_by_uuid(user.id, team_id),
         to_user <- Users.by_uuid(user_id),
         {:ok, _} <- Teams.team_by_uuid(to_user.id, team_id) do

      SequenceWeb.Endpoint.broadcast! "user:#{user_id}", "file_transfer", %{ id: channel_id, from: user.uuid,
          from_name: user.name, team: team_id, description: description }
      json conn, %{ success: true }
    else
      nil -> {:error, :unauthorized}
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  # POST /logs/call
  def send_call_log(conn, %{ "team_id" => team_id, "call_id" => call_id }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, _} <- Teams.team_by_uuid(user.id, team_id) do

      path = "#{team_id}/#{call_id}/#{user.uuid}"
      {:ok, url} = ExAws.Config.new(:s3) |> ExAws.S3.presigned_url(:put, "tandem-call-logs", path,
        query_params: [{"x-amz-storage-class", "ONEZONE_IA"}])
      json conn, %{ url: url, path: path }
    else
      nil -> {:error, :unauthorized}
      {:error, :not_found} -> {:error, :not_found}
    end
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

  # POST /calls/background
  def upload_background(conn, %{ "upload" => upload, "token" => token  }) do
    with {:ok, user, _} <- Sequence.Auth.Guardian.resource_from_token(token) do
      scope = {user, Timex.now |> Timex.to_unix |> Integer.to_string}
      with {:ok, file_name} <- VirtualBackground.store({upload, scope}) do
        json conn, %{url: VirtualBackground.url({file_name, scope}, :original) }
      else
        {:error, :invalid_file} -> {:error, :bad_request, "Image type unsupported."}
        error ->
          raise StorageError, message: "Error uploading virtual background: #{inspect(error)}"
      end
    end
  end
end

defmodule Sequence.StorageController.StorageError do
  defexception reason: "Unknown upload error", message: nil
end
