defmodule SequenceWeb.TopicsView do
  use SequenceWeb, :view

  def render("topics.html", %{ topics: topics }) do
    raw "<ul>" <>
      (topics
      |> Enum.map(&("<li><a href='/topics/#{URI.encode_www_form(&1)}'>#{&1}</a></li>"))
      |> Enum.join("\n"))
    <> "</ul>"
  end

  def render("topic.html", %{ topic: topic, data: data }) do
    raw "<h3>#{topic}</h3><pre>#{inspect(data, pretty: true)}</pre>"
  end

end
