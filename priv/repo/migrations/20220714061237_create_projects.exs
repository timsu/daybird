defmodule Sequence.Repo.Migrations.CreateProjects do
  use Ecto.Migration

  def change do
    create table(:projects) do
      add :uuid, :uuid
      add :name, :string, size: 50
      add :archived_at, :utc_datetime
      add :deleted_at, :utc_datetime
      add :meta, :map
      add :creator_id, references(:users, on_delete: :nothing)

      timestamps()
    end

    create unique_index(:projects, [:uuid])
    create index(:projects, [:creator_id])
  end
end
