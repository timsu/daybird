defmodule Sequence.Repo.Migrations.CreateUserProjects do
  use Ecto.Migration

  def change do
    create table(:user_projects) do
      add :role, :string
      add :left_at, :utc_datetime
      add :user_id, references(:users, on_delete: :nothing)
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create index(:user_projects, [:user_id])
    create index(:user_projects, [:project_id])
  end
end
