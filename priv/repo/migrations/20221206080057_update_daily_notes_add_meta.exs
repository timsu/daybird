defmodule Sequence.Repo.Migrations.UpdateDailyNotesAddMeta do
  use Ecto.Migration

  def change do
    alter table(:daily_notes) do
      add :meta, :map
    end
  end
end
