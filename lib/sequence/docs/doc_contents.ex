defmodule Sequence.DocContents do

  def get_doc(uuid) do
    Redix.command(:redix, ["get", "doc:" <> uuid])
  end

  def set_doc(uuid, contents) do
    Redix.command(:redix, ["set", "doc:" <> uuid, contents])
  end

end
