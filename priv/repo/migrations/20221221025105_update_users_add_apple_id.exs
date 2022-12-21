defmodule Sequence.Repo.Migrations.UpdateUsersAddAppleId do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :apple_id, :string, size: 64
    end
  end
end
