defmodule Sequence.OpenAI do

  require Logger

  @url "https://api.openai.com/v1"

  def models do
    get("/models", authenticated_headers())
  end

  # see https://beta.openai.com/docs/api-reference/completions/create
  # {:ok,
  #  %{
  #    "choices" => [
  #      %{
  #        "finish_reason" => "stop",
  #        "index" => 0,
  #        "logprobs" => nil,
  #        "text" => "\n\nThis is a test."
  #      }
  #    ],
  #    "created" => 1673048972,
  #    "id" => "cmpl-6VqkmcsLfr40Y2qodNNM56eleGnsj",
  #    "model" => "text-babbage-001",
  #    "object" => "text_completion",
  #    "usage" => %{
  #      "completion_tokens" => 7,
  #      "prompt_tokens" => 5,
  #      "total_tokens" => 12
  #    }
  #  }}
  def completions(prompt, model \\ "text-babbage-001", max_tokens \\ 16, temperature \\ 0.5) do
    request = %{
      model: model,
      prompt: prompt,
      max_tokens: max_tokens,
      temperature: temperature,
    }

    post("/completions", authenticated_headers(), request)
  end

  def api_key, do: Application.get_env(:sequence, :openai_api_key)

  def std_headers(content_type \\ "application/json") do
    [{"Content-Type", content_type}, {"Accept", "application/json"}]
  end

  def authenticated_headers() do
    token = api_key()
    std_headers() ++ [{"Authorization", "Bearer #{token}"}]
  end

  defp post(url, headers, params) do
    body = Jason.encode!(params)
    Mojito.post(@url <> url, headers, body)
    |> parse_response()
  end

  defp get(url, headers) do
    Mojito.get(@url <> url, headers)
    |> parse_response()
  end

  defp parse_response( {:ok, %Mojito.Response{status_code: 200, body: body}} ) do
    decoded = Poison.decode!(body)
    {:ok, decoded}
  end

  defp parse_response( {:ok, %Mojito.Response{status_code: status, body: body}} ) do
    {:error, :openai, status, body}
  end

  defp parse_response( {:error, %Mojito.Error{message: message, reason: reason}} ) do
    message = message || (inspect(reason) |> String.replace("\"", ""))
    {:error, :openai, :connection_error, message}
  end

end
