defmodule Sequence.DocsTest do
  use Sequence.DataCase

  alias Sequence.Docs

  describe "files" do
    alias Sequence.Docs.File

    import Sequence.DocsFixtures

    @invalid_attrs %{archived_at: nil, deleted_at: nil, name: nil, type: nil, parent: nil, uuid: nil}

    test "list_files/0 returns all files" do
      file = file_fixture()
      assert Docs.list_files() == [file]
    end

    test "get_file!/1 returns the file with given id" do
      file = file_fixture()
      assert Docs.get_file!(file.id) == file
    end

    test "create_file/1 with valid data creates a file" do
      valid_attrs = %{creator_id: 1, project_id: 1,
        name: "some name", type: 0, uuid: "7488a646-e31f-11e4-aace-600308960662"}

      assert {:ok, %File{} = file} = Docs.create_file(valid_attrs)
      assert file.creator_id == 1
      assert file.project_id == 1
      assert file.name == "some name"
      assert file.type == 0
      assert file.uuid == "7488a646-e31f-11e4-aace-600308960662"
    end

    test "create_file/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Docs.create_file(@invalid_attrs)
    end

    test "update_file/2 with valid data updates the file" do
      file = file_fixture()
      update_attrs = %{archived_at: ~U[2022-09-16 23:44:00Z], deleted_at: ~U[2022-09-16 23:44:00Z], name: "some updated name", type: 1, uuid: "7488a646-e31f-11e4-aace-600308960668"}

      assert {:ok, %File{} = file} = Docs.update_file(file, update_attrs)
      assert file.archived_at == ~U[2022-09-16 23:44:00Z]
      assert file.deleted_at == ~U[2022-09-16 23:44:00Z]
      assert file.name == "some updated name"
      assert file.type == 1
      assert file.uuid == "7488a646-e31f-11e4-aace-600308960668"
    end

    test "update_file/2 with invalid data returns error changeset" do
      file = file_fixture()
      assert {:error, %Ecto.Changeset{}} = Docs.update_file(file, @invalid_attrs)
      assert file == Docs.get_file!(file.id)
    end

    test "delete_file/1 deletes the file" do
      file = file_fixture()
      assert {:ok, %File{}} = Docs.delete_file(file)
      assert_raise Ecto.NoResultsError, fn -> Docs.get_file!(file.id) end
    end

    test "change_file/1 returns a file changeset" do
      file = file_fixture()
      assert %Ecto.Changeset{} = Docs.change_file(file)
    end
  end
end
