defmodule Sequence.Billing do
  @moduledoc """
  The Billing context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.Billing.Subscription
  alias Sequence.Billing.Payment

  alias Sequence.Teams
  alias Sequence.Teams.Team

  # map of org_id to paying team_id
  @org_team_aliases %{
    # tandem team / for testing purposes
    1 => 1,

    # visto bio
    1580 => 5914,

    # firstlogic
    10219 => 33152,

    # excite.jp
    5573 => 53435
  }

  def get_billing_team_id(team) do
    @org_team_aliases[team.org_id] || team.id
  end

  @spec get_subscription(Team.t()) :: Subscription.t() | nil
  def get_subscription(team) do
    billing_team_id = get_billing_team_id(team)
    Repo.one(from s in Subscription, where: s.team_id == ^billing_team_id, order_by: [desc: :id], limit: 1)
  end

  @spec get_subscriptions([Team.t()]) :: %{ integer => Subscription.t() }
  def get_subscriptions(teams) do
    billing_team_ids = Enum.map(teams, fn team -> get_billing_team_id(team) end)
    Repo.all(from s in Subscription, where: s.team_id in ^billing_team_ids, order_by: [asc: :id])
    |> Enum.map(fn s -> {s.team_id, s} end)
    |> Enum.into(%{})
  end

  def get_subscription_by_stripe_id(stripe_id) do
    Repo.one(from s in Subscription, where: s.stripe_id == ^stripe_id)
  end

  def create_sub(attrs) do
    resp = create_subscription(attrs)
    %{ stripe_id: stripe_id } = attrs

    case resp do
      {:ok, sub} ->
        pmt = Repo.one(from p in Payment, where: p.stripe_sub_id == ^stripe_id, order_by: [desc: p.end_date], limit: 1)
        if pmt && Timex.after?(pmt.end_date, Timex.now()) do
          update_subscription(sub, %{ valid: true, next_renewal: pmt.end_date })
        end
        {:ok, sub}
      other -> other
    end
  end

  def create_pmt(stripe_id, stripe_sub_id, amount, end_date) do
    create_payment(%{
      stripe_sub_id: stripe_sub_id,
      stripe_id: stripe_id,
      amount: amount,
      end_date: Timex.from_unix(end_date)
    })
    |> case do
      {:ok, pmt} ->
        sub = Repo.one(from p in Subscription, where: p.stripe_id == ^pmt.stripe_sub_id, limit: 1)
        if sub && Timex.after?(pmt.end_date, Timex.now()) do
          update_subscription(sub, %{ valid: true, next_renewal: pmt.end_date })
        end
        {:ok, pmt}
      other -> other
    end
  end

  def valid_sub?(sub) do
    !!sub && !!sub.valid && (sub.next_renewal == nil || Timex.after?(sub.next_renewal, Timex.now()))
  end

  @spec update_subscription_from_stripe(Subscription.t(), Stripe.Subscription.t()) :: {:ok, Subscription.t()} | {:error, binary}
  def update_subscription_from_stripe(sub, stripe_sub) do
    type = stripe_sub.plan.nickname |> String.split(":") |> List.first()
    interval = stripe_sub.plan.interval
    end_date = stripe_sub.current_period_end

    attrs = %{
      type: type,
      interval: interval,
      valid: stripe_sub.status == "active",
      next_renewal: Timex.from_unix(end_date)
    }

    IO.inspect(attrs)

    result = Sequence.Billing.update_subscription(sub, attrs)

    team = Teams.get_team!(sub.team_id)
    if team do
      SequenceWeb.Endpoint.broadcast("team:#{team.uuid}", "update_team", %{})
    end

    result
  end

  @doc """
  Returns the list of subscriptions.

  ## Examples

      iex> list_subscriptions()
      [%Subscription{}, ...]

  """
  def list_subscriptions do
    Repo.all(Subscription)
  end

  @doc """
  Gets a single subscription.

  Raises `Ecto.NoResultsError` if the Subscription does not exist.

  ## Examples

      iex> get_subscription!(123)
      %Subscription{}

      iex> get_subscription!(456)
      ** (Ecto.NoResultsError)

  """
  def get_subscription!(id), do: Repo.get!(Subscription, id)

  @doc """
  Creates a subscription.

  ## Examples

      iex> create_subscription(%{field: value})
      {:ok, %Subscription{}}

      iex> create_subscription(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_subscription(attrs \\ %{}) do
    %Subscription{}
    |> Subscription.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a subscription.

  ## Examples

      iex> update_subscription(subscription, %{field: new_value})
      {:ok, %Subscription{}}

      iex> update_subscription(subscription, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_subscription(%Subscription{} = subscription, attrs) do
    subscription
    |> Subscription.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a subscription.

  ## Examples

      iex> delete_subscription(subscription)
      {:ok, %Subscription{}}

      iex> delete_subscription(subscription)
      {:error, %Ecto.Changeset{}}

  """
  def delete_subscription(%Subscription{} = subscription) do
    Repo.delete(subscription)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking subscription changes.

  ## Examples

      iex> change_subscription(subscription)
      %Ecto.Changeset{data: %Subscription{}}

  """
  def change_subscription(%Subscription{} = subscription, attrs \\ %{}) do
    Subscription.changeset(subscription, attrs)
  end

  @doc """
  Creates a payment.

  ## Examples

      iex> create_payment(%{field: value})
      {:ok, %Payment{}}

      iex> create_payment(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_payment(attrs \\ %{}) do
    %Payment{}
    |> Payment.changeset(attrs)
    |> Repo.insert()
  end
end
