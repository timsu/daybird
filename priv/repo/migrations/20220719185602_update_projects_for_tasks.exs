defmodule Sequence.Repo.Migrations.UpdateProjectsForTasks do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :shortcode, :string, size: 4
      add :color, :string, size: 7
      add :next_id, :integer
    end
  end
end
