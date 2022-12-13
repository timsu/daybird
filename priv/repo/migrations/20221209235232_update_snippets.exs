defmodule Sequence.Repo.Migrations.UpdateSnippets do
  use Ecto.Migration

  def change do
    alter table(:daily_notes) do
      modify :snippet, :string, size: 255, from: :string
    end
  end
end
