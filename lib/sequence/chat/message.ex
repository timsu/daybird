defmodule Sequence.Chat.Message do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.Chat.Channel

  @valid_kinds ["message", "call_lock", "call_unlock", "call_action", "call_action_bg", "missed_call", "link",
    "timer", "raise_hand", "raise_hand_cancel", "image", "file"]
  def should_broadcast(kind) do
    kind != "link"
  end
  def should_mark_unread(kind) do
    kind == "message" or kind == "image" or kind == "file"
  end

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "messages" do
    field :uuid, Ecto.UUID
    field :sender, Ecto.UUID
    field :sender_id, :id
    belongs_to :channel, Channel

    field :attachments, :map
    field :message, :string
    field :deleted_at, :utc_datetime
    field :kind, :string
    field :encrypted, :boolean, default: false

    timestamps()
  end

  @doc false
  def changeset(message, attrs) do
    message
    |> cast(attrs, [:uuid, :sender, :channel_id, :sender_id, :message, :kind, :attachments, :encrypted, :deleted_at])
    |> Sequence.Repo.generate_uuid
    |> validate_required([:uuid, :channel_id, :sender_id])
    |> validate_inclusion(:kind, @valid_kinds)
    |> validate_message_kind
  end

  def validate_message_kind(changeset) do
    if get_field(changeset, :kind) == "message" do
      validate_required(changeset, [:message])
    else
      changeset
    end
  end
end
