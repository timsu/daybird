defmodule Sequence.Projects.ProjectInvite do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "project_invites" do
    field :creator_id, :id
    field :project_id, :id
    field :code, :string
    field :email, :string

    field :deleted_at, :utc_datetime
    field :joined_at, :utc_datetime

    timestamps()
  end

  @doc false
  def changeset(project_invite, attrs) do
    project_invite
    |> cast(attrs, [:creator_id, :project_id, :email, :code, :joined_at, :deleted_at])
    |> validate_required([:creator_id, :project_id])
  end
end
