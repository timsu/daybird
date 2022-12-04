defmodule Sequence.Repo.Migrations.CreateDailyNotes do
  use Ecto.Migration

  def change do
    create table(:daily_notes) do
      add :date, :string, size: 10
      add :snippet, :string, size: 150
      add :uuid, :uuid
      add :creator_id, references(:users, on_delete: :nothing)
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create index(:daily_notes, [:uuid])
    create index(:daily_notes, [:project_id, :date])
  end
end
