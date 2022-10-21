defmodule Sequence.OAuthTokens.OAuthToken do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "oauth_tokens" do
    field :email, :string
    field :access, :string
    field :deleted_at, :naive_datetime
    field :expires_at, :naive_datetime
    field :meta, :map
    field :name, :string
    field :refresh, :string

    belongs_to :user, Sequence.Users.User

    timestamps()
  end

  @doc false
  def changeset(oauth_token, attrs) do
    oauth_token
    |> cast(attrs, [:user_id, :email, :access, :expires_at, :deleted_at, :name, :refresh, :meta])
    |> validate_required([:user_id, :name])
  end
end
