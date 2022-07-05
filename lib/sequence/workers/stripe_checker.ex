defmodule Sequence.Workers.StripeChecker do

  require Logger

  alias Sequence.Billing

  use Oban.Worker,
    queue: :default,
    priority: 3,
    max_attempts: 3

  @impl Oban.Worker
  def timeout(%_{attempt: attempt}), do: attempt * :timer.hours(4)

  @impl Oban.Worker
  def perform(_) do
    Billing.list_subscriptions()
    |> Enum.each(fn %Billing.Subscription{ stripe_id: stripe_id } = sub ->
      Billing.get_subscription_by_stripe_id(stripe_id)
      with {:ok, stripe_sub} <- Stripe.Subscription.retrieve(stripe_id),
           {:ok, _sub} <- Billing.update_subscription_from_stripe(sub, stripe_sub) do
             # Nothing
      else
        {:error, %Ecto.Changeset{ errors: errors }} -> Logger.error("Failed to update subscription: #{errors}")
        {:error, %Stripe.Error{ message: message }} -> Logger.error("Failed to fetch stripe subscription: #{message}")
        other -> Logger.error("Failed to update subscription: #{inspect(other)}")
      end
    end)
  end

end
