defmodule Sequence.Chat do
  @moduledoc """
  The Chat context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.Chat.{Channel, Message, Unread}

  def dm_chat_key(from_user_id, to_user_id) do
    id = Enum.join(Enum.sort([from_user_id, to_user_id]), ":")
    "dm:#{id}"
  end

  def find_channel(key) do
    Repo.one(from c in Channel, where: c.key == ^key, limit: 1)
  end

  def total_messages(channel) do
    Repo.one(from m in Message, select: count("*"), where: m.channel_id == ^channel.id and is_nil(m.deleted_at))
  end

  def find_messages(channel, limit \\ 20, offset \\ 0) do
    Repo.all(from m in Message, where: m.channel_id == ^channel.id and is_nil(m.deleted_at),
      order_by: [desc: :id], offset: ^offset, limit: ^limit)
  end

  def count_messages_from_sender_in_range(channel, sender_id, start_time, end_time) do
    Repo.one(from m in Message,
      select: count(),
      where: m.channel_id == ^channel.id and m.sender_id == ^sender_id and is_nil(m.deleted_at)
        and fragment("inserted_at BETWEEN ? AND ?", ^(start_time), ^(end_time)))
  end

  def find_unread(user, team) do
    Repo.one(from u in Unread, where: u.user_id == ^user.id and u.team_id == ^team.id, order_by: [asc: :id], limit: 1)
  end

  def find_unreads(user, team_ids) do
    Repo.all(from u in Unread, where: u.user_id == ^user.id and u.team_id in ^team_ids)
  end

  def update_unread_map(user, team, map_func) do
    case find_unread(user, team) do
      nil ->
        map = map_func.(%{})
        create_unread(%{ user_id: user.id, team_id: team.id, unread: map })
      unread ->
        map = map_func.(unread.unread || %{})
        update_unread(unread, %{ unread: map })
    end
  end

  def add_unread_message(user, team, key, new_unread) do
    update_unread_map(user, team, fn map ->
      # unread format: [msg1, msg2, # of total unread]
      existing = Map.get(map, key, [nil, nil, 0])
      new_value = case existing do
        x when is_map(x) -> [new_unread, x, 2]
        x when is_list(x) ->
          [msg1, _msg2, count] = x
          [new_unread, msg1, count + 1]
        _ -> [new_unread, nil, 1]
      end
      Map.put(map, key, new_value)
    end)
  end

  def can_read?(user, key) do
    cond do
      String.starts_with?(key, "dm:") ->
        # you can only read DMs if you are a participant
        if String.contains?(key, user.uuid) do
          true
        else
          false
        end
      true ->
        true
    end
  end

  def delete_all_chats(team, "CONFIRM") do
    from(m in Message,
      join: c in Channel, on: c.id == m.channel_id,
      where: c.team_id == ^team.id)
    |> Repo.delete_all
  end

  def get_message(channel, uuid) do
    Repo.one(from m in Message, where: m.channel_id == ^channel.id and m.uuid == ^uuid)
  end

  ### CHANNEL

  @doc """
  Returns the list of channels.

  ## Examples

      iex> list_channels()
      [%Channel{}, ...]

  """
  def list_channels do
    Repo.all(Channel)
  end

  @doc """
  Gets a single channel.

  Raises `Ecto.NoResultsError` if the Channel does not exist.

  ## Examples

      iex> get_channel!(123)
      %Channel{}

      iex> get_channel!(456)
      ** (Ecto.NoResultsError)

  """
  def get_channel!(id), do: Repo.get!(Channel, id)

  @doc """
  Creates a channel.

  ## Examples

      iex> create_channel(%{field: value})
      {:ok, %Channel{}}

      iex> create_channel(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_channel(attrs \\ %{}) do
    %Channel{}
    |> Channel.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a channel.

  ## Examples

      iex> update_channel(channel, %{field: new_value})
      {:ok, %Channel{}}

      iex> update_channel(channel, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_channel(%Channel{} = channel, attrs) do
    channel
    |> Channel.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Channel.

  ## Examples

      iex> delete_channel(channel)
      {:ok, %Channel{}}

      iex> delete_channel(channel)
      {:error, %Ecto.Changeset{}}

  """
  def delete_channel(%Channel{} = channel) do
    Repo.delete(channel)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking channel changes.

  ## Examples

      iex> change_channel(channel)
      %Ecto.Changeset{source: %Channel{}}

  """
  def change_channel(%Channel{} = channel) do
    Channel.changeset(channel, %{})
  end

  ### MESSAGE

  @doc """
  Returns the list of messages.

  ## Examples

      iex> list_messages()
      [%Message{}, ...]

  """
  def list_messages do
    Repo.all(Message)
  end

  @doc """
  Gets a single message.

  Raises `Ecto.NoResultsError` if the Message does not exist.

  ## Examples

      iex> get_message!(123)
      %Message{}

      iex> get_message!(456)
      ** (Ecto.NoResultsError)

  """
  def get_message(id), do: Repo.get(Message, id)
  def get_message!(id), do: Repo.get!(Message, id)

  @doc """
  Creates a message.

  ## Examples

      iex> create_message(%{field: value})
      {:ok, %Message{}}

      iex> create_message(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_message(attrs \\ %{}) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a message.

  ## Examples

      iex> update_message(message, %{field: new_value})
      {:ok, %Message{}}

      iex> update_message(message, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_message(%Message{} = message, attrs) do
    message
    |> Message.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Message.

  ## Examples

      iex> delete_message(message)
      {:ok, %Message{}}

      iex> delete_message(message)
      {:error, %Ecto.Changeset{}}

  """
  def delete_message(%Message{} = message) do
    Repo.delete(message)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking message changes.

  ## Examples

      iex> change_message(message)
      %Ecto.Changeset{source: %Message{}}

  """
  def change_message(%Message{} = message) do
    Message.changeset(message, %{})
  end

  ### UNREAD

  @doc """
  Returns the list of unreads.

  ## Examples

      iex> list_unreads()
      [%Unread{}, ...]

  """
  def list_unreads do
    Repo.all(Unread)
  end

  @doc """
  Gets a single unread.

  Raises `Ecto.NoResultsError` if the Unread does not exist.

  ## Examples

      iex> get_unread!(123)
      %Unread{}

      iex> get_unread!(456)
      ** (Ecto.NoResultsError)

  """
  def get_unread!(id), do: Repo.get!(Unread, id)

  @doc """
  Creates a unread.

  ## Examples

      iex> create_unread(%{field: value})
      {:ok, %Unread{}}

      iex> create_unread(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_unread(attrs \\ %{}) do
    %Unread{}
    |> Unread.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a unread.

  ## Examples

      iex> update_unread(unread, %{field: new_value})
      {:ok, %Unread{}}

      iex> update_unread(unread, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_unread(%Unread{} = unread, attrs) do
    unread
    |> Unread.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Unread.

  ## Examples

      iex> delete_unread(unread)
      {:ok, %Unread{}}

      iex> delete_unread(unread)
      {:error, %Ecto.Changeset{}}

  """
  def delete_unread(%Unread{} = unread) do
    Repo.delete(unread)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking unread changes.

  ## Examples

      iex> change_unread(unread)
      %Ecto.Changeset{source: %Unread{}}

  """
  def change_unread(%Unread{} = unread) do
    Unread.changeset(unread, %{})
  end

end
