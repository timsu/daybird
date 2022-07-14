defmodule Sequence.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  schema "projects" do
    field :archived_at, :utc_datetime
    field :meta, :map
    field :name, :string
    field :creator_id, :id

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :archived_at, :meta])
    |> validate_required([:name, :archived_at, :meta])
  end
end
