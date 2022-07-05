
defmodule SequenceWeb.ChatView do
  use SequenceWeb, :view

  def render_message(m, temp_uuid \\ nil) do
    %{
      id: m.uuid,
      sender: m.sender,
      msg: m.message,
      ts: m.inserted_at,
      kind: m.kind,
      attachment: m.attachments,
      temp_uuid: temp_uuid
    }
  end

  def render("messages.json", %{messages: messages, total: total}) do
    %{
      messages: messages |> Enum.map(&render_message(&1)),
      total: total
    }
  end

  def render("message.json", %{total: total, message: message} = params) do
    %{
      message: render_message(message, params.temp_uuid),
      total: total
    }
  end

end
