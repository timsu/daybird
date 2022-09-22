defmodule SequenceWeb.DocsController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Docs, DocContents, Projects}

  # GET /files
  def list_files(conn, %{ "project_id" => project_uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      list = Docs.list_docs(project)
      render "list.json", files: list
    end
  end

  # GET /doc
  def get_doc(conn, %{ "project_id" => project_uuid, "uuid" => uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, _doc} <- Docs.doc_by_uuid(project, uuid) do

      case DocContents.get_doc(uuid) do
        {:ok, data} -> text conn, data
        {:error, reason} ->
          {:error, :bad_request, "Failed to read doc: #{reason}"}
      end
    end
  end

  # POST /doc/save
  def save_doc(conn, %{ "project_id" => project_uuid, "uuid" => uuid, "contents" => contents }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, _doc} <- Docs.doc_by_uuid(project, uuid) do

      case DocContents.set_doc(uuid, contents) do
        :ok -> json conn, %{ success: true }
        {:error, reason} ->
          {:error, :bad_request, "Failed to save doc: #{reason}"}
      end
    end
  end

  # POST /files
  def create_file(conn, %{ "project_id" => project_uuid, "parent" => parent, "name" => name, "type" => type }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, _doc} <- validate_parent(project, parent),
         {:ok, doc} <- Docs.create_doc(%{
            parent: parent,
            name: name,
            type: type,
            creator_id: user.id,
            project_id: project.id
          }) do

      render "get.json", file: doc
    end
  end

  defp validate_parent(project, parent) do
    if parent, do: Docs.doc_by_uuid(project, parent), else: {:ok, nil}
  end

  # POST /files/rename
  def rename_file(conn, %{ "project_id" => project_uuid, "uuid" => uuid, "new_name" => new_name }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, doc} <- Docs.doc_by_uuid(project, uuid),
         {:ok, doc} <- Docs.update_doc(doc, %{ name: new_name }) do

      render "get.json", file: doc
    end
  end

  # POST /files/archive
  def archive_file(conn, %{ "project_id" => project_uuid, "uuid" => uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, doc} <- Docs.doc_by_uuid(project, uuid),
         {:ok, doc} <- Docs.update_doc(doc, %{ archived_at: Timex.now }) do

      render "get.json", file: doc
    end
  end

  # POST /files/delete
  def delete_file(conn, %{ "project_id" => project_uuid, "uuid" => uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, doc} <- Docs.doc_by_uuid(project, uuid),
         {:ok, doc} <- Docs.update_doc(doc, %{ archived_at: Timex.now }) do

      render "get.json", file: doc
    end
  end

end
