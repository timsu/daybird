defmodule Sequence.Docs.File do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Users.User, Projects.Project}

  def type_doc, do: 0
  def type_folder, do: 1

  @type t :: %__MODULE__{}

  schema "files" do
    field :uuid, Ecto.UUID
    field :parent, Ecto.UUID

    field :archived_at, :utc_datetime
    field :deleted_at, :utc_datetime
    field :name, :string
    field :type, :integer

    belongs_to :creator, User
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(file, attrs) do
    file
    |> cast(attrs, [:uuid, :parent, :name, :type, :archived_at, :deleted_at, :creator_id, :project_id])
    |> Repo.generate_uuid
    |> validate_required([:uuid, :name, :type, :project_id, :creator_id])
    |> Repo.truncate(:name, 100)
    |> unique_constraint(:uuid)
  end
end
