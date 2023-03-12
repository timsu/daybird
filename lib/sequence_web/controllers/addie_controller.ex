defmodule SequenceWeb.AddieController do
  use SequenceWeb, :controller

  require Logger

  action_fallback SequenceWeb.FallbackController

  # POST /generate/addie
  def generate_chat(conn, %{ "messages" => messages }) do
    ip_addr = conn.remote_ip |> :inet.ntoa() |> to_string()

    messages = [%{ role: "system", content: "You are an ADHD coach helping a client with ADHD." } | messages]

    case Hammer.check_rate("addie:#{ip_addr}", 60_000, 5) do
      {:allow, _count} ->
        with {:ok, response} <- Sequence.OpenAI.chat(ip_addr, messages) do
          IO.inspect(response)
          result = hd(response["choices"])["content"] |> String.trim
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
