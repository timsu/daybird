defmodule Sequence.Users.UserData do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "user_data" do
    field :key, :string
    field :value, :map

    belongs_to :user, Sequence.Users.User
    belongs_to :team, Sequence.Teams.Team

    timestamps()
  end

  @doc false
  def changeset(user_data, attrs) do
    user_data
    |> cast(attrs, [:user_id, :team_id, :key, :value])
    |> validate_required([:user_id, :key, :value])
    |> unique_constraint(:key, name: :user_data_user_id_team_id_key_index)
  end
end
