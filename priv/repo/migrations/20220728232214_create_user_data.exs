defmodule Sequence.Repo.Migrations.CreateUserData do
  use Ecto.Migration

  def change do
    create table(:user_data) do
      add :key, :string
      add :value, :map
      add :user_id, references(:users, on_delete: :nothing)
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create index(:user_data, [:user_id])
    create unique_index(:user_data, [:user_id, :project_id, :key])
  end
end
