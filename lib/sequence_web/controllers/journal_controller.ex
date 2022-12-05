defmodule SequenceWeb.JournalController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Docs, Journal, Projects}

  # GET /daily_notes
  def list_notes(conn, %{ "project_id" => project_uuid, "start" => start_date, "end" => end_date }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do
      list = Journal.get_daily_notes(project.id, start_date, end_date)
      render conn, "list.json", notes: list
    end
  end

  # POST /daily_notes/:date
  def save_note(conn, %{ "project_id" => project_uuid, "date" => date, "snippet" => snippet } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do
      {:ok, note} = case Journal.get_daily_note(project.id, date) do
        nil ->
          Journal.create_daily_note(%{ creator_id: user.id, project_id: project.id, date: date,
            snippet: snippet, uuid: params["id"] })
        note ->
          if note.snippet != snippet do
            Journal.update_daily_note(note, %{ snippet: snippet })
          else
            {:ok, note}
          end
      end

      render conn, "get.json", note: note
    end
  end

end
