defmodule Sequence.Repo.Migrations.CreateOrgs do
  use Ecto.Migration

  def up do
    create table(:orgs) do
      add :uuid, :uuid
      add :name, :string, size: 50
      add :domain, :string, size: 50
      add :meta, :map

      timestamps()
    end

    create index(:orgs, [:uuid])
    create index(:orgs, [:domain])

    alter table(:users) do
      add :org_id, references(:orgs, on_delete: :nothing)
    end

    create index(:users, [:org_id])
  end

  def down do
    alter table(:users) do
      remove :org_id, references(:orgs)
    end

    drop table(:orgs)
  end

end
