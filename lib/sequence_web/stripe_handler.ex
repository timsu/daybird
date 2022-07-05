defmodule Sequence.StripeHandler do

  @behaviour Stripe.WebhookHandler

  alias Sequence.Billing

  @impl true
  def handle_event(%Stripe.Event{type: "invoice.paid"} = event) do

    IO.inspect("Payment Success")
    IO.inspect(event, limit: :infinity)

    item = List.first(event.data.object.lines.data)

    with stripe_id when not is_nil(stripe_id) <- event.data.object.charge,
         stripe_sub_id when not is_nil(stripe_id) <- event.data.object.subscription,
         expiration when not is_nil(expiration) <- item.period.end,
         amount when not is_nil(amount) <- item.amount,
         {:ok, _payment} <- Sequence.Billing.create_pmt(stripe_id, stripe_sub_id, amount, expiration) |> IO.inspect() do

      :ok
    else
      nil -> {:error, :bad_request}
      {:error, :not_found} -> {:error, :not_found}
      _ -> {:error, :unknown}
    end

  end

  @impl true
  def handle_event(%Stripe.Event{type: "invoice.payment_failed"} = event) do
    IO.inspect("Payment Failed")
    IO.inspect(event, limit: :infinity)

    # There's probably nothing we need to do here since we will have a valid-until date on the
    # subscription, but we should probably log it and maybe send an email to the user.

    with stripe_id when not is_nil(stripe_id) <- event.data.object.subscription,
        sub when not is_nil(sub) <- Sequence.Billing.get_subscription_by_stripe_id(stripe_id) do

      LogDNA.BatchLogger.error(
        "Payment Failed for sub #{sub.stripe_id} team id (#{sub.team_id}) user (#{sub.user_id})",
        event
      )

      :ok
    else
      _ -> {:error, :not_found}
    end
  end

  @impl true
  def handle_event(%Stripe.Event{type: "checkout.session.completed"} = event) do
    IO.inspect("Checkout Session Completed")
    IO.inspect(event, limit: :infinity)
    stripe_object = event.data.object

    with user_email when not is_nil(user_email) <- stripe_object.customer_email,
         team_uuid when not is_nil(team_uuid) <- stripe_object.metadata["team"],
         stripe_id when not is_nil(stripe_id) <- stripe_object.subscription,
         {:ok, team} <- Sequence.Teams.team_by_uuid(team_uuid),
         {:ok, user} <- Sequence.Users.find_by_email(user_email) do

      attrs = %{
        customer_id: event.data.object.customer,
        stripe_id: stripe_id,
        team_id: team.id,
        user_id: user.id,
      }

      {:ok, sub} = Sequence.Billing.create_sub(attrs)

      {:ok, stripe_sub} = Stripe.Subscription.retrieve(stripe_id) |> IO.inspect()

      {:ok, _sub} = Billing.update_subscription_from_stripe(sub, stripe_sub)

      # Continue to provision the subscription as payments continue to be made.
      # Store the status in your database and check when a user accesses your service.
      # This approach helps you avoid hitting rate limits.
      :ok
    else
      nil -> {:error, :bad_request}
      {:error, :not_found} -> {:error, :not_found}
      _ -> {:error, :unknown}
    end
    # Payment is successful and the subscription is created.
    # You should provision the subscription and save the customer ID to your database.
    :ok
  end

  @impl true
  def handle_event(%Stripe.Event{type: "customer.subscription.updated"} = event) do
    IO.inspect("Subscription Updated")
    IO.inspect(event, limit: :infinity)
    with stripe_id when not is_nil(stripe_id) <- event.data.object.id,
         sub when not is_nil(sub) <- Sequence.Billing.get_subscription_by_stripe_id(stripe_id),
         {:ok, stripe_sub} <- Stripe.Subscription.retrieve(stripe_id) do

      {:ok, _sub} = Billing.update_subscription_from_stripe(sub, stripe_sub)

      :ok
    else
      _ -> {:error, :not_found}
    end
  end

  @impl true
  def handle_event(%Stripe.Event{type: "customer.subscription.deleted"} = event) do
    IO.inspect("Subscription Deleted")
    IO.inspect(event, limit: :infinity)
    with stripe_id when not is_nil(stripe_id) <- event.data.object.id,
         sub when not is_nil(sub) <- Sequence.Billing.get_subscription_by_stripe_id(stripe_id),
         {:ok, stripe_sub} <- Stripe.Subscription.retrieve(stripe_id) do

      {:ok, _sub} = Billing.update_subscription_from_stripe(sub, stripe_sub)

      :ok
    else
      _ -> {:error, :not_found}
    end
  end
  # Return HTTP 200 for unhandled events
  @impl true
  def handle_event(_event), do: :ok

end
