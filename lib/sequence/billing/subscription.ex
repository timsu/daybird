defmodule Sequence.Billing.Subscription do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "subscriptions" do
    field :stripe_id, :string
    field :customer_id, :string
    field :type, Ecto.Enum, values: [:small, :medium, :large]
    field :interval, Ecto.Enum, values: [:month, :year]
    field :valid, :boolean, default: false
    field :next_renewal, :utc_datetime
    field :team_id, :id
    field :user_id, :id

    timestamps()
  end

  @doc false
  def changeset(subscription, attrs) do
    subscription
    |> cast(attrs, [:stripe_id, :customer_id, :type, :interval, :valid, :next_renewal, :team_id, :user_id])
    |> validate_required([:stripe_id, :customer_id, :team_id, :user_id])
  end
end
