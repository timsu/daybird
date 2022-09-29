defmodule Sequence.Repo.Migrations.UpdateDocsAddBytes do
  use Ecto.Migration

  def change do
    alter table(:docs) do
      add :bindata, :binary
    end
  end
end
