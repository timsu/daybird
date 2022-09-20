defmodule Sequence.DocsTest do
  use Sequence.DataCase

  alias Sequence.Docs

  describe "docs" do
    alias Sequence.Docs.Doc

    import Sequence.DocsFixtures

    @invalid_attrs %{archived_at: nil, deleted_at: nil, name: nil, type: nil, parent: nil, uuid: nil}

    test "list_docs/0 returns all docs" do
      doc = doc_fixture()
      assert Docs.list_docs() == [doc]
    end

    test "get_doc!/1 returns the doc with given id" do
      doc = doc_fixture()
      assert Docs.get_doc!(doc.id) == doc
    end

    test "create_doc/1 with valid data creates a doc" do
      valid_attrs = %{creator_id: 1, project_id: 1,
        name: "some name", type: 0, uuid: "7488a646-e31f-11e4-aace-600308960662"}

      assert {:ok, %Doc{} = doc} = Docs.create_doc(valid_attrs)
      assert doc.creator_id == 1
      assert doc.project_id == 1
      assert doc.name == "some name"
      assert doc.type == 0
      assert doc.uuid == "7488a646-e31f-11e4-aace-600308960662"
    end

    test "create_doc/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Docs.create_doc(@invalid_attrs)
    end

    test "update_doc/2 with valid data updates the doc" do
      doc = doc_fixture()
      update_attrs = %{archived_at: ~U[2022-09-16 23:44:00Z], deleted_at: ~U[2022-09-16 23:44:00Z], name: "some updated name", type: 1, uuid: "7488a646-e31f-11e4-aace-600308960668"}

      assert {:ok, %Doc{} = doc} = Docs.update_doc(doc, update_attrs)
      assert doc.archived_at == ~U[2022-09-16 23:44:00Z]
      assert doc.deleted_at == ~U[2022-09-16 23:44:00Z]
      assert doc.name == "some updated name"
      assert doc.type == 1
      assert doc.uuid == "7488a646-e31f-11e4-aace-600308960668"
    end

    test "update_doc/2 with invalid data returns error changeset" do
      doc = doc_fixture()
      assert {:error, %Ecto.Changeset{}} = Docs.update_doc(doc, @invalid_attrs)
      assert doc == Docs.get_doc!(doc.id)
    end

    test "delete_doc/1 deletes the doc" do
      doc = doc_fixture()
      assert {:ok, %Doc{}} = Docs.delete_doc(doc)
      assert_raise Ecto.NoResultsError, fn -> Docs.get_doc!(doc.id) end
    end

    test "change_doc/1 returns a doc changeset" do
      doc = doc_fixture()
      assert %Ecto.Changeset{} = Docs.change_doc(doc)
    end
  end
end
