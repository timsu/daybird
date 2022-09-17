defmodule Sequence.Docs.Doc do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Users.User, Projects.Project}

  @type t :: %__MODULE__{}

  schema "docs" do
    field :uuid, Ecto.UUID

    field :archived_at, :utc_datetime
    field :deleted_at, :utc_datetime
    field :name, :string
    field :path, :string

    belongs_to :creator, User
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(doc, attrs) do
    doc
    |> cast(attrs, [:uuid, :name, :path, :archived_at, :deleted_at, :creator_id, :project_id])
    |> validate_required([:uuid, :name, :path, :project_id, :creator_id])
  end
end
