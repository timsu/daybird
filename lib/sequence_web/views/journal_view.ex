
defmodule SequenceWeb.JournalView do
  use SequenceWeb, :view

  alias Sequence.Utils

  def render_doc(doc) do
    uuid = Utils.no_dash(doc.uuid)
    %{
      id: uuid,
      date: doc.date,
      snippet: doc.snippet,
    }
  end

  def render("list.json", %{notes: docs}) do
    %{
      notes: docs |> Enum.map(&render_doc(&1)),
    }
  end

  def render("get.json", %{note: doc}) do
    %{
      note: render_doc(doc)
    }
  end

end
