defmodule SequenceWeb.DocsControllerTest do
  use SequenceWeb.ConnCase

  alias Sequence.{Users, Docs, Docs.File, Projects, Utils}

  import Sequence.DocsFixtures

  describe "list_files/2" do

    test "no files", %{conn: conn} do
      {user, _, project_uuid} = user_project()

      response = conn
      |> auth(user)
      |> get("/api/v1/files?project_id=#{project_uuid}")
      |> json_response(200)

      assert response["files"] == []
    end


    test "with files", %{conn: conn} do
      {user, _, project_uuid} = user_project()

      file1 = file_fixture(%{ name: "bob", type: File.type_folder })
      file2 = file_fixture(%{ name: "joe", type: File.type_doc, parent: file1.uuid })

      response = conn
      |> auth(user)
      |> get("/api/v1/files?project_id=#{project_uuid}")
      |> json_response(200)

      assert length(response["files"]) == 2

      f1 = Enum.find response["files"], fn f -> f["id"] == Utils.no_dash(file1.uuid) end
      assert f1["name"] == "bob"

      f2 = Enum.find response["files"], fn f -> f["id"] == Utils.no_dash(file2.uuid) end
      assert f2["name"] == "joe"
      assert f2["parent"] == f1["id"]
    end

  end

  describe "create_files/2" do

    test "create doc file", %{conn: conn} do
      {user, project, project_uuid} = user_project()

      response = conn
      |> auth(user)
      |> post("/api/v1/files?project_id=#{project_uuid}", %{ name: "bob", type: 0 })
      |> json_response(200)

      assert response["file"]["name"] == "bob"

      doc = Docs.file_by_uuid project, response["id"]
      assert doc
    end

  end

  describe "save_doc/2" do

    test "create doc contents", %{conn: conn} do
      {user, project, project_uuid} = user_project()

      file = file_fixture(%{ name: "joe", type: File.type_doc })
      uuid = Utils.no_dash(file.uuid)

      _response = conn
      |> auth(user)
      |> post("/api/v1/doc?project_id=#{project_uuid}", %{
        uuid: uuid,
        contents: "hi bob"
      })
      |> json_response(200)

      {:ok, doc} = Docs.doc_by_uuid project, uuid
      assert doc
      assert doc.contents == "hi bob"
    end

    test "save doc contents bindata", %{conn: conn} do
      {user, _project, project_uuid} = user_project()

      file = file_fixture(%{ name: "joe", type: File.type_doc })
      uuid = Utils.no_dash(file.uuid)

      bindata = Base.encode64("secret code")

      _response = conn
      |> auth(user)
      |> post("/api/v1/doc?project_id=#{project_uuid}", %{
        uuid: uuid,
        bindata: bindata
      })
      |> json_response(200)

      response = conn
      |> auth(user)
      |> get("/api/v1/doc?project_id=#{project_uuid}&uuid=#{uuid}")
      |> text_response(200)

      {:ok, decoded} = Base.decode64(response)
      assert decoded
    end

    test "update doc contents", %{conn: conn} do
      {user, project, project_uuid} = user_project()

      doc = doc_fixture(%{ contents: "abc 123", uuid: Ecto.UUID.generate })
      uuid = Utils.no_dash(doc.uuid)

      _response = conn
      |> auth(user)
      |> post("/api/v1/doc?project_id=#{project_uuid}", %{
        uuid: uuid,
        contents: "def 456"
      })
      |> json_response(200)

      {:ok, doc} = Docs.doc_by_uuid project, uuid
      assert doc.contents == "def 456"
    end

  end


  describe "get_doc/2" do

    test "get text contents", %{conn: conn} do
      {user, project, project_uuid} = user_project()

      {:ok, doc} = Docs.create_doc(%{
        project_id: project.id,
        uuid: Ecto.UUID.generate,
        contents: "hello world"
      })
      uuid = Utils.no_dash(doc.uuid)

      response = conn
      |> auth(user)
      |> get("/api/v1/doc?project_id=#{project_uuid}&uuid=#{uuid}")
      |> text_response(200)

      assert response == "hello world"
    end

    test "get empty contents", %{conn: conn} do
      {user, _project, project_uuid} = user_project()
      uuid = Ecto.UUID.generate

      response = conn
      |> auth(user)
      |> get("/api/v1/doc?project_id=#{project_uuid}&uuid=#{uuid}")
      |> text_response(200)

      assert response == ""
    end

  end

end
