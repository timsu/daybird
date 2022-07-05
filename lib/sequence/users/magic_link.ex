defmodule Sequence.Users.MagicLink do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.Users.User

  @type t :: %__MODULE__{}

  schema "magic_links" do
    field :email, :string
    field :body, :string
    field :redeemed_at, :utc_datetime

    belongs_to :user, User

    timestamps()
  end

  @doc false
  def changeset(magic_link, attrs) do
    attrs = if attrs[:email] do
      %{attrs | email: String.downcase(attrs[:email])}
    else
      attrs
    end
    magic_link
    |> cast(attrs, [:user_id, :email, :body, :redeemed_at])
    |> validate_required([:body])
    |> unique_constraint(:user_id)
    |> foreign_key_constraint(:user_id)
    |> validate_at_least_one_of([:user_id, :email])
  end

  defp validate_at_least_one_of(changeset, fields) do
    fields
    |> Enum.reduce(false, fn (field, acc) ->
      acc || !!get_field(changeset, field)
    end)
    |> case do
      true -> changeset
      false -> add_error(changeset, hd(fields), "Expected at least one of #{inspect(fields)} to be present")
    end
  end
end
