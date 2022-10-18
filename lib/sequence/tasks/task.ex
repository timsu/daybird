defmodule Sequence.Tasks.Task do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Users.User, Projects.Project}

  @type t :: %__MODULE__{}

  def type_task, do: 0
  def type_story, do: 1

  schema "tasks" do
    field :uuid, Ecto.UUID

    field :type, :integer
    field :title, :string
    field :description, :string
    field :short_code, :string
    field :state, :string
    field :priority, :integer
    field :doc, :string

    field :due_at, :utc_datetime
    field :archived_at, :utc_datetime
    field :completed_at, :utc_datetime
    field :deleted_at, :utc_datetime

    belongs_to :creator, User
    belongs_to :user, User
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(task, attrs) do
    task
    |> cast(attrs, [:type, :short_code, :title, :description, :state, :completed_at, :deleted_at,
      :archived_at, :project_id, :user_id, :creator_id, :doc, :priority])
    |> Repo.generate_uuid
    |> validate_required([:uuid, :short_code, :title, :creator_id, :project_id])
    |> Repo.truncate(:doc, 100)
  end
end
