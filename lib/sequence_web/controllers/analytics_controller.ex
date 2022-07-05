defmodule SequenceWeb.AnalyticsController do
  use SequenceWeb, :controller
  require Logger
  import Ecto.Query, warn: false

  action_fallback SequenceWeb.FallbackController
  alias Sequence.{Config, CallLogs, CallLogs.CallLog, CallLogs.UserCall,
    CallLogs.CallFeedback, Invites, Invites.TeamInvite, Repo, Users, Users.User, Users.FunnelData,
    Teams.Team}
  alias SequenceWeb.EnsureAdmin

  plug :ensure_analytics

  def can_view(conn, _) do
    json conn, %{ success: true }
  end

  ### query

  def query(conn, %{ "source" => source }) do
    data = case source do
      # kpi charts
      "active_users/7" -> active_users(-7)
      "active_users/1" -> active_users(-1)
      "active_teams/7" -> active_teams(-7)
      "call_time/7" -> call_time(-7)
      "call_failures/7" -> call_failures(-7)
      "billable_users/30" -> billable_users(-30)
      "new_users/7" -> new_users(-7)
      "new_users/1" -> new_users(-1)
      "new_users_multi/1" -> new_users_multi(-1)
      "new_users_multi/7" -> new_users_multi(-7)

      # engagement charts
      "champion_user_funnel/7" -> champion_user_funnel(-7)
      "non_champion_user_funnel/7" -> non_champion_user_funnel(-7)
      "activated_teams_percentage/7" -> ratio(activated_teams_by_type(-7, "sign-up"), new_teams_by_type(-7, "sign-up"), 0)|> scale(100)
      "activated_teammates_percentage/7" -> ratio(activated_non_champion_users(-7), new_non_champion_users(-7), 0)|> scale(100)
      "email_invites_funnel/7" -> email_invites_funnel(-7)
      "calls_per_active_user/7" -> ratio(call_count(-7), active_users(-7), 0)

      # call charts
      "call_time/1" -> call_time(-1)
      "call_count/1" -> unique_call_count(-1)
      "call_failure_ratio/7" -> call_failure_ratio(-7)
      "call_feedback_ratio/7" -> call_feedback_ratio(-7)
      "feedback_count/7" -> feedback_count(-7)
      "call_failures/1" -> call_failures(-1)
      "call_errors/1" -> call_errors(-1)
      "call_time_per_user/1" -> ratio(call_time(-1), active_users(-1), 0)
      "calls_per_user/1" -> ratio(call_count(-1), active_users(-1), 0)
      "users_reporting_errors/1" -> users_reporting_errors(-1)
      "users_with_failure/1" -> users_with_failure(-1)
      "viral_multi/7" -> viral_multi(-7)
    end
    json conn, data
  end

  def viral(d, type \\ nil, skip_value \\ false) do
    fetch_data_for_query("viral_#{type}", d, fn start_time, end_time ->
      Sequence.Analytics.viral_coefficient_in_window_by_type(start_time, end_time, type)
    end, skip_value)
  end

  def viral_multi(d) do
    meetings = viral(d, "meeting", true)
    invites = viral(d, "invite", true)
    all = viral(d)

    %{
      multi: [
        %{ data: all.data, label: "Total" },
        %{ data: meetings.data, label: "Invites" },
        %{ data: invites.data, label: "Meetings" },
      ]
    }
  end

  def okrs(conn, params) do
    offset = if params["offset"], do: Integer.parse(params["offset"]) |> elem(0), else: 0
    new_users = new_users(-7, true) |> get_latest(offset)
    active_users = active_users(-7, true) |> get_latest(offset)
    active_teams = active_teams(-7, true) |> get_latest(offset)
    render conn, "okrs.html", offset: offset, active_users: active_users,
      new_users: new_users, active_teams: active_teams
  end

  def get_latest(data, offset) do
    rows = data |> Map.get(:data)
    sorted = rows |> Map.keys |> Enum.sort(&Date.compare(&1, &2) == :gt)
    latest = sorted |> Enum.at(offset)
    rows[latest]
  end

  ### dashboard

  @chart_dates -30..-1

  def active_users(d, skip_value \\ false) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in UserCall, select: count(c.user_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)))
    end, skip_value)
  end

  def active_teams(d, skip_value \\ false) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in UserCall, select: count(c.team_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)))
    end, skip_value)
  end

  def call_time(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in UserCall, select: sum(c.call_length) / 3600.0,
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)))
    end)
  end

  def call_time_by_service(d, service) do
    fetch_data_for_query("call-time-#{service}", d, fn start_time, end_time ->
      Repo.one(from c in UserCall, select: sum(c.call_length) / 3600.0,
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)) and c.service == ^service)
    end)
  end

  def call_time_multi(d) do
    all = call_time(d)
    ion = call_time_by_service(d, "ion-sfu")

    %{
      multi: [
        %{ data: all.data, label: "Total" },
        %{ data: ion.data, label: "Ion" },
      ],
      value: all.value
    }
  end

  def call_count(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in UserCall, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)))
    end)
  end

  def unique_call_count(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in UserCall, select: count(c.call_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)))
    end)
  end

  def billable_users(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in UserCall, select: count(c.user_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)),
        having: sum(c.call_length) >= 3600)
    end)
  end

  def call_failures(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in CallLog, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
          and c.event_type == ^CallLogs.event_type_failure)
    end)
  end

  def call_errors(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in CallLog, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
          and c.event_type == ^CallLogs.event_type_error)
    end)
  end

  def users_reporting_errors(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from c in CallFeedback, select: count(c.user_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
          and c.rating != "great")
    end)
  end

  def users_with_failure(d) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      subq = from c in CallLog, where:
        c.inserted_at > ^(start_time) and c.inserted_at < ^(end_time)
        and c.event_type == ^CallLogs.event_type_failure

      Repo.one(from c in UserCall, select: count(c.user_id, :distinct),
        join: s in subquery(subq), on: c.call_id == s.call_id,
        where: c.inserted_at > ^(start_time) and c.inserted_at < ^(end_time))
    end)
  end

  def new_users(d, skip_value \\ false) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from u in User, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)))
    end, skip_value)
  end

  def new_users_type(d, type, skip_value \\ true) do
    # types: expansion, recent, champion, meeting
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{type}", d, fn start_time, end_time ->
      Repo.one(from u in User, select: count(),
        where: u.inserted_at > ^start_time and u.inserted_at < ^end_time and u.origin_type == ^type)
    end, skip_value)
  end

  def new_users_multi(d) do
    expansion = new_users_type(d, "join-exist")
    recent = new_users_type(d, "join-new")
    champion = new_users_type(d, "champion")
    unknown = new_users_type(d, "unknown")
    all = new_users(d)

    %{
      multi: [
        %{ data: all.data, label: "Total" },
        %{ data: recent.data, label: "Recent Teams" },
        %{ data: expansion.data, label: "Expansion" },
        %{ data: champion.data, label: "Champions" },
        %{ data: unknown.data, label: "Unknown" },
      ],
      value: all.value
    }
  end

  def champions_by_funnel_stage(d, stage, skip_value \\ false) do
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{stage}", d, fn start_time, end_time ->
      user_subq = from u in User, select: u.id,
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and u.origin_type == "champion"

      Repo.one(from fd in FunnelData, select: count(), join: u in subquery(user_subq),
        on: fd.user_id == u.id, where: not is_nil(fd.stages[^stage]))
    end, skip_value)
  end

  def non_champions_by_funnel_stage(d, stage, skip_value \\ false) do
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{stage}", d, fn start_time, end_time ->
      user_subq = from u in User, select: u.id,
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and u.origin_type != "champion"

      Repo.one(from fd in FunnelData, select: count(), join: u in subquery(user_subq),
        on: fd.user_id == u.id, where: not is_nil(fd.stages[^stage]))
    end, skip_value)
  end

  def champion_user_funnel(d) do
    signed_up = ratio(champions_by_funnel_stage(d, Users.stage_signed_up), new_users_type(d, "champion"), 0)
    |> scale(100)
    created_team = ratio(champions_by_funnel_stage(d, Users.stage_created_team), new_users_type(d, "champion"), 0)
    |> scale(100)
    completed_survey = ratio(champions_by_funnel_stage(d, Users.stage_completed_survey), new_users_type(d, "champion"), 0)
    |> scale(100)
    downloaded_app = ratio(champions_by_funnel_stage(d, Users.stage_downloaded_app), new_users_type(d, "champion"), 0)
    |> scale(100)
    signed_into_app = ratio(champions_by_funnel_stage(d, Users.stage_signed_into_app), new_users_type(d, "champion"), 0)
    |> scale(100)
    finished_onboarding = ratio(champions_by_funnel_stage(d, Users.stage_finished_onboarding), new_users_type(d, "champion"), 0)
    |> scale(100)
    sent_invite = ratio(champions_by_funnel_stage(d, Users.stage_sent_invite), new_users_type(d, "champion"), 0)
    |> scale(100)
    saw_teammate_online = ratio(champions_by_funnel_stage(d, Users.stage_saw_teammate_online), new_users_type(d, "champion"), 0)
    |> scale(100)
    made_call = ratio(champions_by_funnel_stage(d, Users.stage_made_call), new_users_type(d, "champion"), 0)
    |> scale(100)

    %{
      multi: [
        %{ data: signed_up.data, label: "Signed Up" },
        %{ data: created_team.data, label: "Created Team" },
        %{ data: completed_survey.data, label: "Completed Survey" },
        %{ data: downloaded_app.data, label: "Downloaded App" },
        %{ data: signed_into_app.data, label: "Signed Into App" },
        %{ data: finished_onboarding.data, label: "Finished Onboarding" },
        %{ data: sent_invite.data, label: "Sent Invite" },
        %{ data: saw_teammate_online.data, label: "Saw Teammate Online" },
        %{ data: made_call.data, label: "Made Call" },
      ],
    }
  end

  def non_champion_user_funnel(d) do
    signed_up = ratio(non_champions_by_funnel_stage(d, Users.stage_signed_up), new_non_champion_users(d), 0)
    |> scale(100)
    joined_team = ratio(non_champions_by_funnel_stage(d, Users.stage_joined_team), new_non_champion_users(d), 0)
    |> scale(100)
    completed_survey = ratio(non_champions_by_funnel_stage(d, Users.stage_completed_survey), new_non_champion_users(d), 0)
    |> scale(100)
    downloaded_app = ratio(non_champions_by_funnel_stage(d, Users.stage_downloaded_app), new_non_champion_users(d), 0)
    |> scale(100)
    signed_into_app = ratio(non_champions_by_funnel_stage(d, Users.stage_signed_into_app), new_non_champion_users(d), 0)
    |> scale(100)
    finished_onboarding = ratio(non_champions_by_funnel_stage(d, Users.stage_finished_onboarding), new_non_champion_users(d), 0)
    |> scale(100)
    saw_teammate_online = ratio(non_champions_by_funnel_stage(d, Users.stage_saw_teammate_online), new_non_champion_users(d), 0)
    |> scale(100)
    made_call = ratio(non_champions_by_funnel_stage(d, Users.stage_made_call), new_non_champion_users(d), 0)
    |> scale(100)

    %{
      multi: [
        %{ data: signed_up.data, label: "Signed Up" },
        %{ data: joined_team.data, label: "Joined Team" },
        %{ data: completed_survey.data, label: "Completed Survey" },
        %{ data: downloaded_app.data, label: "Downloaded App" },
        %{ data: signed_into_app.data, label: "Signed Into App" },
        %{ data: finished_onboarding.data, label: "Finished Onboarding" },
        %{ data: saw_teammate_online.data, label: "Saw Teammate Online" },
        %{ data: made_call.data, label: "Made Call" },
      ],
    }
  end

  def new_invites_by_type(d, type, skip_value \\ false) do
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{type}", d, fn start_time, end_time ->
      Repo.one(from i in TeamInvite, select: sum(i.count),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and i.type == ^type)
    end, skip_value)
  end

  def registered_invites_by_type(d, type, skip_value \\ false) do
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{type}", d, fn start_time, end_time ->
      invite_subq = from i in TeamInvite, select: i.id,
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and i.type == ^type

      Repo.one(from u in User, select: count(), join: i in subquery(invite_subq),
        on: u.invite_id == i.id)
    end, skip_value)
  end

  def activated_invites_by_type(d, type, skip_value \\ false) do
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{type}", d, fn start_time, end_time ->
      invite_subq = from i in TeamInvite, select: i.id,
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and i.type == ^type

      Repo.one(from u in User, select: count(), join: i in subquery(invite_subq),
        on: u.invite_id == i.id, where: not is_nil(u.activated_at))
    end, skip_value)
  end

  def email_invites_funnel(d) do
    registered = ratio(registered_invites_by_type(d, Invites.type_email), new_invites_by_type(d, Invites.type_email), 0)
    |> scale(100)
    activated = ratio(activated_invites_by_type(d, Invites.type_email), new_invites_by_type(d, Invites.type_email), 0)
    |> scale(100)

    %{
      multi: [
        %{ data: registered.data, label: "Signed Up" },
        %{ data: activated.data, label: "Activated" },
      ],
      value: activated.value
    }
  end

  def new_teams_by_type(d, type, skip_value \\ false) do
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{type}", d, fn start_time, end_time ->
      Repo.one(from t in Team, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and t.origin_type == ^type)
    end, skip_value)
  end

  def activated_teams_by_type(d, type, skip_value \\ false) do
    fetch_data_for_query("#{elem(__ENV__.function, 0)}/#{type}", d, fn start_time, end_time ->
      Repo.one(from t in Team, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and t.origin_type == ^type and not is_nil(t.activated_at))
    end, skip_value)
  end

  def new_non_champion_users(d, skip_value \\ false) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from u in User, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and u.origin_type != "champion")
    end, skip_value)
  end

  def activated_non_champion_users(d, skip_value \\ false) do
    fetch_data_for_query(elem(__ENV__.function, 0), d, fn start_time, end_time ->
      Repo.one(from u in User, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
        and u.origin_type != "champion" and not is_nil(u.activated_at))
    end, skip_value)
  end

  def feedback_count(d) do
    good = fetch_data_for_query(:good_feedback, d, fn start_time, end_time ->
      Repo.one(from c in CallFeedback, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
          and c.rating == "great")
    end)

    bad = fetch_data_for_query(:bad_feedback, d, fn start_time, end_time ->
      Repo.one(from c in CallFeedback, select: count(),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
          and c.rating != "great")
    end)

    %{
      multi: [
        %{ data: good.data, label: "Great" },
        %{ data: bad.data, label: "Error" },
      ],
      value: good.value + bad.value
    }
  end

  def call_feedback_ratio(d) do
    calls = unique_call_count(d)

    good = fetch_data_for_query(:good_feedback, d, fn start_time, end_time ->
      Repo.one(from c in CallFeedback, select: count(c.call_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
          and c.rating == "great")
    end)
    |> ratio(calls, 0)
    |> scale(100)

    bad = fetch_data_for_query(:bad_feedback, d, fn start_time, end_time ->
      Repo.one(from c in CallFeedback, select: count(c.call_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time))
          and c.rating != "great")
    end)
    |> ratio(calls, 0)
    |> scale(100)

    %{
      multi: [
        %{ data: good.data, label: "Great" },
        %{ data: bad.data, label: "Error" },
      ],
      value: bad.value
    }
  end

  def call_failure_ratio(d) do
    users = active_users(d)

    failures = fetch_data_for_query(:failure, d, fn start_time, end_time ->
      st = (start_time)
      et = (end_time)

      from(c in UserCall, select: count(c.user_id, :distinct),
        where: c.call_id in fragment("select call_id from call_logs where
        inserted_at > ? and inserted_at < ? and event_type = ?", ^st, ^et, ^CallLogs.event_type_failure)
        and c.inserted_at > ^st and c.inserted_at < ^et)
      |> Repo.one([timeout: 120_000])
    end, true)
    |> ratio(users, 0)
    |> scale(100)

    reported = fetch_data_for_query(:reported, d, fn start_time, end_time ->
      st = (start_time)
      et = (end_time)

      from(c in CallFeedback, select: count(c.user_id, :distinct),
        where: fragment("inserted_at BETWEEN ? AND ?", ^st, ^et)
        and c.rating != "great")
      |> Repo.one([timeout: 120_000])
    end, true)
    |> ratio(users, 0)
    |> scale(100)

    %{
      multi: [
        %{ data: failures.data, label: "Users w/ Failure" },
        %{ data: reported.data, label: "Reporting Errors" },
      ],
      value: reported.value
    }
  end

  ### helpers

  def ratio(fn_1, fn_2, default) do
    %{ data: data1, value: v1 } = fn_1
    %{ data: data2, value: v2 } = fn_2

    data = Map.keys(data1)
    |> Enum.map(fn k ->
      value1 = Map.get(data1, k, 0)
      value2 = Map.get(data2, k, 0)
      value = if value1 && value2 && value2 != 0, do: value1 / value2, else: default
      {k, value}
    end)
    |> Enum.into(%{})

    value = if v2 != 0, do: v1 / v2, else: default
    %{ data: data, value: value }
  end

  def scale(result, multiplier) do
    %{ data: data, value: value } = result

    data = Enum.map(data, fn {k, v} ->
      {k, v * multiplier}
    end)
    |> Enum.into(%{})

    %{ data: data, value: value * multiplier }
  end

  def fetch_data_for_query(name, date_window, query_fn, skip_value \\ false) do
    key = "#{name}/#{date_window}"
    current_time_tz = Timex.now("America/Los_Angeles")
    dates = Enum.to_list(@chart_dates)
    |> Enum.map(fn d -> Timex.shift(current_time_tz, days: d) |> Timex.end_of_day end)

    data = get_data(key, dates, fn date ->
      start_date = Timex.shift(date, days: date_window)
      end_date = date
      query_fn.(start_date, end_date)
    end)

    value = case skip_value do
      true -> 0
      _ ->
        case query_fn.(Timex.shift(Timex.now, days: date_window), Timex.now) do
          %Decimal{} = x -> Decimal.to_float(x)
          nil -> 0
          x -> x
        end
    end
    %{ data: data, value: value }
  end

  def get_data(prefix, dates, query_fn) do
    redis_keys = dates
    |> Enum.map(fn d -> "#{prefix}:#{Timex.to_date(d)}" end)

    use_cache = Config.get(:skip_cache) != "true"
    {:ok, redis_data} = Redix.command(:redix, ["MGET" | redis_keys])

    Enum.zip(dates, redis_data)
    |> Enum.map(fn {datetime, cached_data} ->
      date = Timex.to_date(datetime)

      if use_cache && cached_data && cached_data != "" do
        case Float.parse(cached_data) do
          {value, _} -> {date, value}
          :error -> {date, 0}
          end
      else
        count = case query_fn.(datetime) do
          %Decimal{} = x -> Decimal.to_float(x)
          nil -> 0
          x -> x
        end
        key = "#{prefix}:#{date}"
        Redix.command(:redix, ["SET", key, count])
        {date, count}
      end
    end)
    |> Enum.into(%{})
  end

  ###

  def ensure_analytics(conn, _) do
    with user <- Guardian.Plug.current_resource(conn) do
      result = EnsureAdmin.validate_analytics(user)
      if Sequence.dev? or result == :ok do
        assign(conn, :user, user)
      else
        conn |> SequenceWeb.FallbackController.call(result) |> halt()
      end
    end
  end

end
