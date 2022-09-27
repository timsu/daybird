defmodule Sequence.Projects.UserProject do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Users.User, Projects.Project}

  @type t :: %__MODULE__{}

  schema "user_projects" do
    field :role, :string
    field :left_at, :utc_datetime

    belongs_to :user, User
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(user_project, attrs) do
    user_project
    |> cast(attrs, [:user_id, :project_id, :role, :left_at])
    |> validate_required([:user_id, :project_id, :role])
  end
end
