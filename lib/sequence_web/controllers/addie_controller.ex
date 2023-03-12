defmodule SequenceWeb.AddieController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  # POST /generate/addie
  def generate_chat(conn, %{ "messages" => messages }) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do

      case Hammer.check_rate("addie:#{user.id}", 60_000, 5) do
        {:allow, _count} ->
          IO.inspect(messages)
          with {:ok, response} <- Sequence.OpenAI.chat(user.id, messages) do
            IO.inspect(response)
            result = hd(response["choices"])["message"]["content"] |> String.trim
            text conn, result
          else
            {:error, :openai, _status, body} ->
              IO.inspect(body)
              {:error, :bad_request, "Unable to chat"}
          end
        {:deny, _limit} ->
          {:error, :too_many_requests, "Too many requests"}
      end
    end
  end

end
