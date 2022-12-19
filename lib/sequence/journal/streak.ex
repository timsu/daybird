defmodule Sequence.Journal.Streak do
  use Ecto.Schema
  import Ecto.Changeset

  schema "streaks" do
    field :current, :integer
    field :date, :string
    field :longest, :integer
    field :user_id, :id

    timestamps()
  end

  @doc false
  def changeset(streak, attrs) do
    streak
    |> cast(attrs, [:date, :current, :longest])
    |> validate_required([:date, :current, :longest])
  end
end
