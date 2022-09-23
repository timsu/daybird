defmodule SequenceWeb.DocsControllerTest do
  use SequenceWeb.ConnCase

  alias Sequence.{Users, Docs.File, Projects, Utils}

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

end
