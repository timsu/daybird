defmodule Sequence.Repo.Migrations.CreateDocs do
  use Ecto.Migration

  def change do
    create table(:docs) do
      add :uuid, :uuid
      add :contents, :text
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create unique_index(:docs, [:uuid])
    create index(:docs, [:project_id])
  end
end
