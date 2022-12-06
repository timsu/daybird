defmodule Sequence.JournalTest do
  use Sequence.DataCase

  alias Sequence.Journal

  describe "daily_notes" do
    alias Sequence.Journal.DailyNote

    import Sequence.JournalFixtures

    @invalid_attrs %{date: nil, snippet: nil, uuid: nil, type: nil}

    test "list_daily_notes/0 returns all daily_notes" do
      daily_note = daily_note_fixture()
      assert Journal.list_daily_notes() == [daily_note]
    end

    test "get_daily_note!/1 returns the daily_note with given id" do
      daily_note = daily_note_fixture()
      assert Journal.get_daily_note!(daily_note.id) == daily_note
    end

    test "create_daily_note/1 with valid data creates a daily_note" do
      valid_attrs = %{creator_id: 1, project_id: 1, date: "some date",
        type: "type1", snippet: "some snippet",
        uuid: "7488a646-e31f-11e4-aace-600308960662"}

      assert {:ok, %DailyNote{} = daily_note} = Journal.create_daily_note(valid_attrs)
      assert daily_note.date == "some date"
      assert daily_note.type == "type1"
      assert daily_note.snippet == "some snippet"
      assert daily_note.uuid == "7488a646-e31f-11e4-aace-600308960662"
    end

    test "create_daily_note/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Journal.create_daily_note(@invalid_attrs)
    end

    test "update_daily_note/2 with valid data updates the daily_note" do
      daily_note = daily_note_fixture()
      update_attrs = %{date: "date 2", snippet: "some updated snippet", uuid: "7488a646-e31f-11e4-aace-600308960668"}

      assert {:ok, %DailyNote{} = daily_note} = Journal.update_daily_note(daily_note, update_attrs)
      assert daily_note.date == "date 2"
      assert daily_note.snippet == "some updated snippet"
      assert daily_note.uuid == "7488a646-e31f-11e4-aace-600308960668"
    end

    test "update_daily_note/2 with invalid data returns error changeset" do
      daily_note = daily_note_fixture()
      assert {:error, %Ecto.Changeset{}} = Journal.update_daily_note(daily_note, @invalid_attrs)
      assert daily_note == Journal.get_daily_note!(daily_note.id)
    end

    test "delete_daily_note/1 deletes the daily_note" do
      daily_note = daily_note_fixture()
      assert {:ok, %DailyNote{}} = Journal.delete_daily_note(daily_note)
      assert_raise Ecto.NoResultsError, fn -> Journal.get_daily_note!(daily_note.id) end
    end

    test "change_daily_note/1 returns a daily_note changeset" do
      daily_note = daily_note_fixture()
      assert %Ecto.Changeset{} = Journal.change_daily_note(daily_note)
    end
  end

end
