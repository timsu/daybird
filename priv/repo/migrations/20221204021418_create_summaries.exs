defmodule Sequence.Repo.Migrations.CreateSummaries do
  use Ecto.Migration

  def change do
    create table(:summaries) do
      add :type, :string, size: 5
      add :date, :string, size: 10
      add :snippet, :string, size: 100
      add :uuid, :uuid
      add :creator_id, references(:users, on_delete: :nothing)
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create index(:summaries, [:uuid])
    create index(:summaries, [:project_id, :type])
    create index(:summaries, [:project_id, :type, :date])
  end
end
