defmodule Sequence.Journal.Summary do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Users.User, Projects.Project}

  schema "summaries" do
    field :date, :string
    field :snippet, :string
    field :type, :string
    field :uuid, Ecto.UUID

    belongs_to :creator, User
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(summary, attrs) do
    summary
    |> cast(attrs, [:date, :snippet, :type, :uuid, :creator_id, :project_id])
    |> Repo.generate_uuid
    |> validate_required([:date, :uuid, :type, :creator_id])
    |> Repo.truncate(:snippet, 100)
    |> unique_constraint(:uuid)
  end
end
