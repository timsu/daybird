defmodule Sequence.Chat.Channel do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.Teams.Team

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "channels" do
    field :uuid, Ecto.UUID
    belongs_to :team, Team
    field :key, :string

    timestamps()
  end

  @doc false
  def changeset(channel, attrs) do
    channel
    |> cast(attrs, [:uuid, :team_id, :key])
    |> Sequence.Repo.generate_uuid
    |> validate_required([:uuid, :key])
  end
end
