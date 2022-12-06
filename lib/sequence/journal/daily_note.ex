defmodule Sequence.Journal.DailyNote do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Repo, Users.User, Projects.Project}

  schema "daily_notes" do
    field :type, :string
    field :date, :string
    field :snippet, :string
    field :uuid, Ecto.UUID
    field :meta, :map

    belongs_to :creator, User
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(daily_note, attrs) do
    daily_note
    |> cast(attrs, [:type, :date, :snippet, :uuid, :creator_id, :project_id, :meta])
    |> Repo.generate_uuid
    |> validate_required([:type, :date, :uuid, :creator_id])
    |> Repo.truncate(:snippet, 100)
    |> unique_constraint(:uuid)
  end
end
