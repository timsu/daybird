defmodule Sequence.AttachmentsTest do
  use Sequence.DataCase

  alias Sequence.Attachments

  describe "attachments" do
    alias Sequence.Attachments.Attachment

    import Sequence.AttachmentsFixtures

    @invalid_attrs %{filename: nil, path: nil, size: nil, uuid: nil}

    test "list_attachments/0 returns all attachments" do
      attachment = attachment_fixture()
      assert Attachments.list_attachments() == [attachment]
    end

    test "get_attachment!/1 returns the attachment with given id" do
      attachment = attachment_fixture()
      assert Attachments.get_attachment!(attachment.id) == attachment
    end

    test "create_attachment/1 with valid data creates a attachment" do
      valid_attrs = %{filename: "some filename", path: "some path", size: 42,
        uuid: "7488a646-e31f-11e4-aace-600308960662", project_id: 1, user_id: 1}

      assert {:ok, %Attachment{} = attachment} = Attachments.create_attachment(valid_attrs)
      assert attachment.filename == "some filename"
      assert attachment.path == "some path"
      assert attachment.size == 42
      assert attachment.uuid == "7488a646-e31f-11e4-aace-600308960662"
    end

    test "create_attachment/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Attachments.create_attachment(@invalid_attrs)
    end

    test "update_attachment/2 with valid data updates the attachment" do
      attachment = attachment_fixture()
      update_attrs = %{filename: "some updated filename", path: "some updated path", size: 43, uuid: "7488a646-e31f-11e4-aace-600308960668"}

      assert {:ok, %Attachment{} = attachment} = Attachments.update_attachment(attachment, update_attrs)
      assert attachment.filename == "some updated filename"
      assert attachment.path == "some updated path"
      assert attachment.size == 43
      assert attachment.uuid == "7488a646-e31f-11e4-aace-600308960668"
    end

    test "update_attachment/2 with invalid data returns error changeset" do
      attachment = attachment_fixture()
      assert {:error, %Ecto.Changeset{}} = Attachments.update_attachment(attachment, @invalid_attrs)
      assert attachment == Attachments.get_attachment!(attachment.id)
    end

    test "delete_attachment/1 deletes the attachment" do
      attachment = attachment_fixture()
      assert {:ok, %Attachment{}} = Attachments.delete_attachment(attachment)
      assert_raise Ecto.NoResultsError, fn -> Attachments.get_attachment!(attachment.id) end
    end

    test "change_attachment/1 returns a attachment changeset" do
      attachment = attachment_fixture()
      assert %Ecto.Changeset{} = Attachments.change_attachment(attachment)
    end
  end
end
