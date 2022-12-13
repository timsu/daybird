defmodule Sequence.Repo.Migrations.UpdateSnippets do
  use Ecto.Migration

  def change do
    alter table(:daily_notes) do
      change :snippet, :string, size: 255
    end
  end
end
