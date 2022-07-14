defmodule Sequence.Tasks.Task do
  use Ecto.Schema
  import Ecto.Changeset

  schema "tasks" do
    field :completed_at, :utc_datetime
    field :deleted_at, :utc_datetime
    field :description, :string
    field :short_id, :integer
    field :state, :string
    field :title, :string
    field :creator_id, :id
    field :user_id, :id
    field :project_id, :id

    timestamps()
  end

  @doc false
  def changeset(task, attrs) do
    task
    |> cast(attrs, [:short_id, :title, :description, :state, :completed_at, :deleted_at])
    |> validate_required([:short_id, :title, :description, :state, :completed_at, :deleted_at])
  end
end
