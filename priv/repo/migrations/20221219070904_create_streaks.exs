defmodule Sequence.Repo.Migrations.CreateStreaks do
  use Ecto.Migration

  def change do
    create table(:streaks) do
      add :date, :string
      add :current, :integer
      add :longest, :integer
      add :user_id, references(:users, on_delete: :nothing)

      timestamps()
    end

    create index(:streaks, [:user_id])
  end
end
