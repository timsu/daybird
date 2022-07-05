defmodule SequenceWeb.BillingController do
  use SequenceWeb, :controller
  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Teams, Billing}

  # GET /billing/info
  # get basic billing info
  def info(conn, %{ "team" => id }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, team, _user_team} <- Teams.user_team_by_uuid(user, id),
         sub <- Billing.get_subscription(team) do

      july1stEOD = ~N[2022-07-02 00:00:00]
      twoWeeksAfterCreation = Timex.shift(team.inserted_at, weeks: 2)
      deadline = if Timex.after?(july1stEOD, twoWeeksAfterCreation), do: july1stEOD, else: twoWeeksAfterCreation
      next_days = Timex.diff(deadline, Timex.now, :days)

      json conn, %{
        size: Teams.get_active_user_teams_count(team.id),
        valid: Billing.valid_sub?(sub),
        next_days: next_days,
        plan: sub != nil && sub.type
      }
    end
  end

  # POST /billing/new
  # initiate subscription
  def new(conn, %{ "plan" => plan, "period" => period, "team" => team_id }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, team, _user_team} <- Teams.user_team_by_uuid(user, team_id) do

      price_codes = Application.get_env(:sequence, :stripe_products)
      prices = price_codes[plan]
      price_id = elem(prices, if(period == "annual", do: 1, else: 0))

      session_config = %{
        cancel_url: Sequence.base_url <> "/auth/subscription?cancel=true",
        success_url: Sequence.base_url <> "/auth/subscription?success=true",
        mode: "subscription",
        customer_email: user.email,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        metadata: %{
          "team" => team.uuid
        },
        line_items: [
          %{
            price: price_id,
            quantity: 1
          }
        ]
      }

      case Stripe.Session.create(session_config) do
        {:ok, session} ->
          json conn, %{ url: session.url }

        {:error, stripe_error} ->
          IO.inspect(stripe_error)
          {:error, :bad_request, stripe_error.message}
      end
    end
  end

  # POST /billing/manage
  # manage subscription
  def manage(conn, %{ "team" => id }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, team, _user_team} <- Teams.user_team_by_uuid(user, id),
         sub <- Billing.get_subscription(team) do

      customer = if sub, do: sub.customer_id

      session_config = %{
        customer: customer,
        return_url: Sequence.base_url <> "/auth/subscription"
      }

      case Stripe.BillingPortal.Session.create(session_config) do
        {:ok, session} ->
          json conn, %{ url: session.url }

        {:error, stripe_error} ->
          IO.inspect(stripe_error)
          {:error, :bad_request, stripe_error.message}
      end
    end
  end

end
