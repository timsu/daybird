
defmodule SequenceWeb.DocsView do
  use SequenceWeb, :view

  alias Sequence.Utils

  def render_doc(doc) do
    uuid = Utils.no_dash(doc.uuid)
    parent = if(doc.parent, do: Utils.no_dash(doc.parent))
    %{
      id: uuid,
      name: doc.name,
      type: doc.type,
      parent: if(parent != uuid, do: parent),
      archived_at: doc.archived_at,
      deleted_at: doc.deleted_at
    }
  end

  def render("list.json", %{files: docs}) do
    %{
      files: docs |> Enum.map(&render_doc(&1)),
    }
  end

  def render("get.json", %{file: doc}) do
    %{
      file: render_doc(doc)
    }
  end

end
