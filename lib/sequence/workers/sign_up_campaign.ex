defmodule Sequence.Workers.SignUpCampaign do

  require Logger

  alias Sequence.{Users, Teams, Mailer}
  alias SequenceWeb.{Emails}

  use Oban.Worker,
    queue: :default,
    priority: 2

  defmodule Params do
    defstruct [:invite_code, :user_id, :team_id, :to_email, :to_name, :to_nickname, :reminder_number]
  end

  @impl Oban.Worker
  def timeout(_), do: :timer.minutes(5)

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"invite_code" => invite_code, "user_id" => user_id,
  "team_id" => team_id, "to_email" => to_email, "to_name" => to_name, "to_nickname" => to_nickname,
  "reminder_number" => reminder_number}}) do
    perform(%Params{invite_code: invite_code, user_id: user_id, team_id: team_id,
    to_email: to_email, to_name: to_name, to_nickname: to_nickname,
    reminder_number: reminder_number})
  end

  def perform(%Oban.Job{args: args}) do
    Logger.info("Got a job with unknown args: #{inspect(args)}")
    {:discard, "Unknown args"}
  end

  def perform(params = %Params{}) do
    case Users.find_by_email(params.to_email) do
      {:ok, _} -> nil
      {:error, _} ->
        user = Users.get_user(params.user_id)
        team = Teams.get_team(params.team_id)
        Emails.invite_tandem_reminder(user, team, params.invite_code, params.to_email, params.to_nickname, params.reminder_number)
        |> Mailer.deliver_later
        case params.reminder_number do
          r when r in [1, 2] -> enqueue_reminder(%{params | reminder_number: params.reminder_number + 1})
          3 -> nil
        end
        :ok
    end
  end

  def initiate_campaign(params = %Params{}) do
    enqueue_reminder(%{params | reminder_number: 1})
  end

  defp enqueue_reminder(params = %Params{}) do
    # struct encoding/decoding doesn't play nicely with oban so manually decode before enqueing
    %{invite_code: params.invite_code, user_id: params.user_id, team_id: params.team_id,
    to_email: params.to_email, to_name: params.to_name, to_nickname: params.to_nickname,
    reminder_number: params.reminder_number}
    |> __MODULE__.new(scheduled_at: time(params.user_id))
    |> Oban.insert()
  end

  defp time(user_id) do
    if Sequence.prod?() do
      user = Users.get_user(user_id)
      Sequence.Utils.next_weekday(user.timezone)
    else
      Timex.now |> Timex.shift(seconds: 5)
    end
  end

end
