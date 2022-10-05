defmodule Sequence.Attachments.Attachment do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Users.User, Projects.Project}

  @type t :: %__MODULE__{}

  schema "attachments" do
    field :filename, :string
    field :path, :string
    field :size, :integer
    field :uuid, Ecto.UUID

    belongs_to :user, User
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(attachment, attrs) do
    attachment
    |> cast(attrs, [:uuid, :filename, :path, :size, :project_id, :user_id])
    |> Repo.generate_uuid
    |> validate_required([:uuid, :filename, :path, :size, :project_id, :user_id])
  end
end
