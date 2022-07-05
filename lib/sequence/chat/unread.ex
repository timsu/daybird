defmodule Sequence.Chat.Unread do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "unreads" do
    field :unread, :map
    field :user_id, :id
    field :team_id, :id

    timestamps()
  end

  @doc false
  def changeset(unread, attrs) do
    unread
    |> cast(attrs, [:user_id, :team_id, :unread])
    |> validate_required([:user_id, :team_id, :unread])
  end
end
