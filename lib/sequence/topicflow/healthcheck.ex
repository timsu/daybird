defmodule Sequence.Topicflow.Healthcheck do
  def init(req, _) do
    {:ok, :cowboy_req.reply(200, %{}, "", req), nil}
  end
end
