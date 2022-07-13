defmodule Sequence.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do

      add :uuid, :uuid
      add :name, :string, size: 50
      add :nickname, :string, size: 50
      add :email, :string, size: 50
      add :google_id, :string, size: 25
      add :profile_img, :string, size: 255
      add :password_hash, :string, size: 60
      add :timezone, :string, size: 30
      add :invite_id, :integer
      add :meta, :map
      add :activated_at, :utc_datetime
      add :origin_type, :string, size: 10

      timestamps()
    end

    create unique_index(:users, [:email])
    create unique_index(:users, [:uuid])
    create unique_index(:users, [:google_id])
  end
end
