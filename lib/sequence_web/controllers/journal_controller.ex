defmodule SequenceWeb.JournalController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Journal, Projects, Utils}

  # GET /daily_notes
  def list_notes(conn, %{ "project_id" => project_uuid, "type" => type,
      "start" => start_date, "end" => end_date }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do
      list = Journal.get_daily_notes(project.id, type, start_date, end_date)
      render conn, "list.json", notes: list
    end
  end

  # POST /daily_notes/:date
  def save_note(conn, %{ "project_id" => project_uuid, "type" => type,
      "date" => date, "snippet" => snippet } = params) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn),
         {:ok, project} <- Projects.project_by_uuid(user, project_uuid) do
      {:ok, note} = case Journal.get_daily_note(project.id, type, date) do
        nil ->
          Journal.create_daily_note(%{ creator_id: user.id, project_id: project.id,
            date: date, type: type, snippet: snippet,
            uuid: if(params["id"], do: Utils.uuid_to_base16(params["id"])) })
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

  # POST /generate/summary
  def generate_summary(conn, %{ "notes" => notes }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      prompt = "Summarize my past week:\n" <> notes

      prompt_hash = :crypto.hash(:md5 , prompt) |> Base.encode16()
      case Redix.command(:redix, ["GET", "summary:" <> prompt_hash]) do
        {:ok, nil} ->
          with {:ok, response} <- Sequence.OpenAI.completions(prompt, "text-babbage-001", 150, 0.5) do
            IO.puts("missed cache cache")
            result = hd(response["choices"])["text"] |> String.trim
            Redix.command(:redix, ["PUT", "summary:" <> prompt_hash, result])
            text conn, result
          else
            {:error, :openai, _status, body} ->
              IO.inspect(body)
              {:error, :bad_request, "Unable to generate summary"}
          end
        {:ok, data} ->
          IO.puts("hit cache")
          text conn, data
      end
    end
  end

end
