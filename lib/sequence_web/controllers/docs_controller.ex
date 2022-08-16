defmodule SequenceWeb.DocsController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Docs, Projects}

  # GET /files
  def list_files(conn, %{ "project_id" => project_uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      case Docs.list_docs(project) do
        {:ok, list} -> json conn, %{ files: list }
        {:error, reason} ->
          {:error, :bad_request, "Failed to list docs: #{reason}"}
      end
    end
  end

  # GET /doc
  def get_doc(conn, %{ "project_id" => project_uuid, "filename" => filename }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      case Docs.read_doc(project, filename) do
        {:ok, data} -> text conn, data
        {:error, reason} ->
          {:error, :bad_request, "Failed to read doc: #{reason}"}
      end
    end
  end

  # POST /doc/save
  def save_doc(conn, %{ "project_id" => project_uuid, "filename" => filename, "contents" => contents }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      case Docs.write_doc(project, filename, contents) do
        :ok -> json conn, %{ success: true }
        {:error, reason} ->
          {:error, :bad_request, "Failed to save doc: #{reason}"}
      end
    end
  end

  # POST /files/folder
  def create_folder(conn, %{ "project_id" => project_uuid, "path" => path }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      case Docs.new_folder(project, path) do
        :ok -> json conn, %{ success: true }
        {:error, reason} ->
          {:error, :bad_request, "Failed to list docs: #{reason}"}
      end
    end
  end

  # POST /doc/rename
  def rename_doc(conn, %{ "project_id" => project_uuid, "filename" => filename, "new_name" => new_name }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      case Docs.rename(project, filename, new_name) do
        :ok -> json conn, %{ success: true }
        {:error, reason} ->
          {:error, :bad_request, "Failed to rename doc: #{reason}"}
      end
    end
  end

  # POST /doc/delete
  def delete_doc(conn, %{ "project_id" => project_uuid, "filename" => filename }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      case Docs.delete(project, filename) do
        :ok -> json conn, %{ success: true }
        {:error, reason} ->
          {:error, :bad_request, "Failed to rename doc: #{reason}"}
      end
    end
  end

end
