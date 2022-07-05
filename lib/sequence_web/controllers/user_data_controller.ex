defmodule SequenceWeb.UserDataController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.{ICal, Users, Teams}

  action_fallback SequenceWeb.FallbackController

  @ical_key "ical"

  # GET "/users/data"
  def get_user_data(conn, %{ "key" => key } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      {_, user_data} = user_data_helper(user, params, key)
      json conn, %{ data: user_data && user_data.value }
    end
  end

  # POST "/users/data"
  def set_user_data(conn, %{ "key" => key, "data" => data } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      {team, user_data} = user_data_helper(user, params, key)

      if !user_data do
        Users.create_user_data(%{ user_id: user.id, team_id: team && team.id, key: key, value: data })
      else
        if data do
          Users.update_user_data(user_data, %{ value: data })
        else
          Users.delete_user_data(user_data)
        end
      end
      :ok
    end
  end

  defp user_data_helper(user, params, key) do
    team = if params["team"] do
      {:ok, team} = Teams.team_by_uuid(user.id, params["team"])
      team
    end
    user_data = Users.get_user_data(user, team, key)
    {team, user_data}
  end

  # GET "/calendar/ical"
  def get_ical(conn, %{ "team" => team }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, team),
         data <- Users.get_user_data(user, team, @ical_key) do

      if !data do
        json conn, %{ urls: %{} }
      else
        json conn, %{ urls: data.value }
      end
    else
      nil -> {:error, :unauthorized}
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  # GET "/calendar/ical/events"
  def ical_events(conn, %{ "team" => team }) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, team),
         data <- Users.get_user_data(user, team, @ical_key) do

      if !data do
        json conn, %{ events: [] }
      else
        find_until = Timex.shift(Timex.now, hours: 1)
        events = Map.keys(data.value) |> Enum.flat_map(fn url ->
          type = data.value[url]["type"]
          if type == "off" do
            []
          else
            case ICal.fetch(url) do
              {:ok, events} ->
                ICal.find_events(events, Timex.now, find_until)
                |> Enum.map(fn event ->
                  name = if type == "busy", do: nil, else: event.summary
                  %{ name: name, start: event.dtstart, end: event.dtend }
                end)
              _ -> []
            end
          end
        end)

        json conn, %{ events: events }
      end
    end
  end

  # POST "/calendar/ical"
  # types: title, busy, remove
  def update_ical(conn, %{ "team" => team, "url" => url, "type" => type } = params) do
    with user <- Guardian.Plug.current_resource(conn),
         {:ok, team} <- Teams.team_by_uuid(user.id, team),
         :ok <- validate_ical_url(url, type),
         user_data <- Users.get_user_data(user, team, @ical_key) do

      map = if user_data, do: user_data.value, else: %{}

      map = cond do
        type == "remove" -> Map.delete(map, url)
        params["name"] -> Map.put(map, url, %{
          type: type,
          name: params["name"]
        })
        true ->
          existing = Map.get(map, url) || %{}
          Map.put(map, url, Map.put(existing, "type", type))
      end

      if !user_data do
        Users.create_user_data(%{ user_id: user.id, team_id: team.id, key: @ical_key, value: map })
      else
        Users.update_user_data(user_data, %{ value: map })
      end

      json conn, %{ success: true, urls: map }
    end
  end

  def validate_ical_url(_, "remove"), do: :ok

  def validate_ical_url(nil, _), do: {:error, :bad_request, "URL is missing"}

  def validate_ical_url(url, _) do
    try do
      case ICal.fetch(url) do
        {:ok, _} -> :ok
        {:error, message} -> {:error, :bad_request, message}
      end
    catch
      kind, reason ->
        Sequence.Appsignal.set_meta_data(%{ url: url })
        Appsignal.set_error(kind, reason, __STACKTRACE__)
        {:error, :bad_request, "iCal parse error. Please let us know about this."}
    end
  end

end
