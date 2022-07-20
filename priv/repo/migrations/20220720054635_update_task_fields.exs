defmodule Sequence.Repo.Migrations.UpdateTaskFields do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      remove :short_id, :integer

      add :type, :integer
      add :short_code, :string, size: 10
      add :due_at, :utc_datetime
      add :archived_at, :utc_datetime
      add :priority, :integer
    end

    create index(:tasks, [:short_code])
    create index(:tasks, [:project_id, :archived_at, :deleted_at])
  end
end
