defmodule SequenceWeb.DocsController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Docs, Projects, Utils}

  # GET /files
  def list_files(conn, %{ "project_id" => project_uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do
      list = Docs.list_files(project)
      render conn, "list.json", files: list
    end
  end

  # GET /doc
  def get_doc(conn, %{ "project_id" => project_uuid, "uuid" => uuid }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do

      case Docs.doc_by_uuid(project, uuid) do
        {:ok, doc} ->
          if doc.bindata do
            encoded = Base.encode64(doc.bindata)
            text conn, encoded
          else
            text conn, doc.contents
          end
        {:error, :not_found} -> text conn, ""
      end
    end
  end

  # POST /doc
  def save_doc(conn, %{ "project_id" => project_uuid, "uuid" => uuid, "contents" => contents }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, _doc} <- Docs.set_doc_contents(project, uuid, contents) do

      :ok
    end
  end

  def save_doc(conn, %{ "project_id" => project_uuid, "uuid" => uuid, "bindata" => bindata }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, decoded} <- Base.decode64(bindata),
         {:ok, _doc} <- Docs.set_doc_bindata(project, uuid, decoded) do

      :ok
    end
  end

  # POST /files
  def create_file(conn, %{ "project_id" => project_uuid, "name" => name, "type" => type } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         parent <- validate_parent(project, params["parent"]),
         {:ok, doc} <- Docs.create_file(%{
            uuid: if(params["id"], do: Utils.uuid_to_base16(params["id"])),
            parent: parent,
            name: name,
            type: type,
            creator_id: user.id,
            project_id: project.id
          }) do

      render conn, "get.json", file: doc
    end
  end

  defp validate_parent(_project, nil), do: nil

  defp validate_parent(_project, parent) do
    Sequence.Utils.uuid_to_base16(parent)
  end

  # PUT /files/id
  def update_file(conn, %{ "project_id" => project_uuid, "id" => uuid } = params) do
    attrs = Utils.params_to_attrs params, ["name", "archived_at", "deleted_at"]
    attrs = if Map.has_key?(params, "parent"), do: Map.put(attrs, "parent", Utils.uuid_to_base16(params["parent"])), else: attrs

    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid),
         {:ok, doc} <- Docs.file_by_uuid(project, uuid),
         {:ok, doc} <- Docs.update_file(doc, attrs) do

      if params["projectId"] do
        {:ok, new_project} = Projects.project_by_uuid(user, params["projectId"])
        Docs.move_doc(doc, new_project)
      end

      render conn, "get.json", file: doc
    end
  end

end
