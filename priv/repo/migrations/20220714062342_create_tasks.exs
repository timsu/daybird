defmodule Sequence.Repo.Migrations.CreateTasks do
  use Ecto.Migration

  def change do
    create table(:tasks) do
      add :short_id, :integer
      add :title, :string
      add :description, :text
      add :state, :string
      add :completed_at, :utc_datetime
      add :deleted_at, :utc_datetime
      add :creator_id, references(:users, on_delete: :nothing)
      add :user_id, references(:users, on_delete: :nothing)
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create index(:tasks, [:creator_id])
    create index(:tasks, [:user_id])
    create index(:tasks, [:project_id])
  end
end
