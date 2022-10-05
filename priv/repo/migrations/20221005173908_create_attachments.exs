defmodule Sequence.Repo.Migrations.CreateAttachments do
  use Ecto.Migration

  def change do
    create table(:attachments) do
      add :uuid, :uuid
      add :filename, :string
      add :path, :string
      add :size, :integer
      add :project_id, references(:projects, on_delete: :nothing)
      add :user_id, references(:users, on_delete: :nothing)

      timestamps()
    end

    create index(:attachments, [:project_id])
    create index(:attachments, [:user_id])
    create index(:attachments, [:uuid])
  end
end
