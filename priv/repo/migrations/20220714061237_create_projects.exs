defmodule Sequence.Repo.Migrations.CreateProjects do
  use Ecto.Migration

  def change do
    create table(:projects) do
      add :name, :string
      add :archived_at, :utc_datetime
      add :meta, :map
      add :creator_id, references(:users, on_delete: :nothing)

      timestamps()
    end

    create index(:projects, [:creator_id])
  end
end
