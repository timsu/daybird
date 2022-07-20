defmodule Sequence.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Users.User}

  @type t :: %__MODULE__{}

  schema "projects" do
    field :uuid, Ecto.UUID
    field :archived_at, :utc_datetime
    field :deleted_at, :utc_datetime
    field :meta, :map
    field :name, :string
    field :shortcode, :string
    field :next_id, :integer
    field :color, :string

    belongs_to :creator, User

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:uuid, :creator_id, :name, :archived_at, :deleted_at, :meta, :shortcode,
      :next_id, :color])
    |> Repo.generate_uuid
    |> validate_required([:uuid, :creator_id, :name, :shortcode])
    |> validate_length(:name, min: 1, max: 50)
    |> validate_length(:shortcode, min: 1, max: 4)
    |> validate_length(:color, max: 7)
  end
end
