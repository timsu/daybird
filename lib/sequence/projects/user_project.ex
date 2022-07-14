defmodule Sequence.Projects.UserProject do
  use Ecto.Schema
  import Ecto.Changeset

  schema "user_projects" do
    field :left_at, :utc_datetime
    field :role, :string
    field :user_id, :id
    field :project_id, :id

    timestamps()
  end

  @doc false
  def changeset(user_project, attrs) do
    user_project
    |> cast(attrs, [:role, :left_at])
    |> validate_required([:role, :left_at])
  end
end
