defmodule Sequence.Repo.Migrations.UpdateTasksAddDoc do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :doc, :string, size: 100
    end
    create index(:tasks, [:project_id, :doc])
  end
end
