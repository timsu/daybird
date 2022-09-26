defmodule Sequence.Repo.Migrations.CreateProjectInvites do
  use Ecto.Migration

  def change do
    create table(:project_invites) do
      add :email, :string, size: 30
      add :code, :string, size: 20
      add :role, :string, size: 10
      add :joined_at, :utc_datetime
      add :deleted_at, :utc_datetime
      add :creator_id, references(:users, on_delete: :nothing)
      add :project_id, references(:projects, on_delete: :nothing)

      timestamps()
    end

    create unique_index(:project_invites, [:code])
    create index(:project_invites, [:email])
    create index(:project_invites, [:creator_id])
    create index(:project_invites, [:project_id])
  end
end
