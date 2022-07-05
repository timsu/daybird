defmodule Sequence.Mobile.PushToken do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.Repo

  alias Sequence.{Users.User}

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "push_tokens" do
    belongs_to :user, User

    field :deleted_at, :utc_datetime
    field :token, :string
    field :type, :string
    field :name, :string
    field :device_id, :string

    timestamps()
  end

  @doc false
  def changeset(push_tokens, attrs) do
    push_tokens
    |> cast(attrs, [:user_id, :type, :token, :deleted_at, :name, :device_id])
    |> validate_required([:user_id, :type, :token, :device_id])
    |> Repo.truncate(:name, 30)
    |> unique_constraint(:device_id, name: :push_tokens_user_id_device_id_type_index)
  end
end
