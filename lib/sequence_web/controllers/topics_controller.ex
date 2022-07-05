
defmodule SequenceWeb.TopicsController do
  use SequenceWeb, :controller
  require Logger

  alias Sequence.Topicflow.Registry

  def index(conn, _params) do
    topics = Registry.list_known_names()
    render(conn, "topics.html", topics: topics)
  end

  def show(conn, %{ "topic" => topic_name }) do
    data = Registry.inspect(topic_name)
    render(conn, "topic.html", topic: topic_name, data: data)
  end

end
