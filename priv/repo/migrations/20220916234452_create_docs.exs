defmodule Sequence.Repo.Migrations.CreateDocs do
  use Ecto.Migration

  def change do
    create table(:docs) do
      add :uuid, :uuid
      add :parent, :uuid
      add :name, :string, size: 100
      add :type, :integer
      add :archived_at, :utc_datetime
      add :deleted_at, :utc_datetime
      add :creator_id, references(:users, on_delete: :nothing)
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create index(:docs, [:uuid])
    create index(:docs, [:creator_id])
    create index(:docs, [:project_id])
  end
end
