defmodule Sequence.Billing.Payment do
  use Ecto.Schema
  import Ecto.Changeset

  schema "payments" do
    field :amount, :decimal
    field :end_date, :utc_datetime
    field :stripe_id, :string
    field :stripe_sub_id, :string

    timestamps()
  end

  @doc false
  def changeset(payment, attrs) do
    payment
    |> cast(attrs, [:stripe_id, :stripe_sub_id, :amount, :end_date])
    |> validate_required([:stripe_id, :stripe_sub_id, :amount, :end_date])
  end
end
