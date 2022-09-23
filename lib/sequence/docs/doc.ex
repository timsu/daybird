defmodule Sequence.Docs.Doc do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Projects.Project}

  @type t :: %__MODULE__{}

  schema "docs" do
    field :contents, :string
    field :uuid, Ecto.UUID

    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(doc, attrs) do
    doc
    |> cast(attrs, [:uuid, :project_id, :contents])
    |> Repo.generate_uuid
    |> validate_required([:uuid, :project_id])
  end
end
