defmodule Sequence.Mobile do
  @moduledoc """
  The Mobile context.
  """

  require Logger

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.{Mobile.PushToken, Utils}
  alias Pigeon.{APNS, FCM}

  defp getTopic(type) do
    case type do
      "apn-voip" -> "#{Application.get_env(:sequence, :bundle_identifier_ios)}.voip"
      "apn" -> Application.get_env(:sequence, :bundle_identifier_ios)
      "fcm" -> Application.get_env(:sequence, :bundle_identifier_android)
    end
  end

  def send_notification(user, payload, async \\ true)

  def send_notification(user, %{ type: "call" } = payload, async) do
    Enum.each(list_active_tokens(user), fn p ->
      topic = getTopic(p.type)
      payload = payload
      |> Map.put(:uuid, payload.call_id)
      |> Map.put(:handle, payload.from)

      case p.type do
        "apn-voip" ->
          n = APNS.Notification.new(payload.from_name, p.token, topic)
          |> APNS.Notification.put_category(payload.type)
          |> APNS.Notification.put_custom(Utils.atoms_to_keys(payload))
          |> APNS.Notification.put_sound(payload[:sound] || "default")
          |> Map.put(:push_type, "voip")
          |> Map.put(:expiration, 0)

          # `:on_response` callback for async pushes.
          if !async do
            res = Pigeon.APNS.push(n)
            if res.response != :success, do: Logger.info(inspect(res))
          else
            on_response = fn(res) -> if res.response != :success, do: Logger.info(inspect(res)) end
            Pigeon.APNS.push(n, on_response: on_response)
          end

        "fcm" ->
          # The key should not be a reserved word ("from" or any word starting with "google" or "gcm").
          data = case payload[:from] do
            nil -> payload
            _ -> Map.put(payload, :from_uuid, Map.get(payload, :from)) |> Map.delete(:from)
          end

          n = FCM.Notification.new(p.token)  # has to be a data-only message
          |> FCM.Notification.put_restricted_package_name(topic)
          |> FCM.Notification.put_data(Utils.atoms_to_keys(data))
          |> FCM.Notification.put_priority(:high)

          # `:on_response` callback for async pushes.
          if !async do
            res = Pigeon.FCM.push(n)
            if res.status != :success, do: Logger.info(inspect(res))
          else
            on_response = fn(res) -> if res.status != :success, do: Logger.info(inspect(res)) end
            Pigeon.FCM.push(n, on_response: on_response)
          end

        _ -> :ok
      end
    end)
  end

  def send_notification(user, payload, async) do
    [title, msg] = case payload[:type] do
      "wave" -> [nil, "#{payload.from_name} just waved at you 👋"]
      "welcome_listeners" -> [nil, "#{payload.from_name} welcomed listeners to a call. Click to listen in."]
      "dm" ->
        cond do
          payload[:kind] == "image" -> [payload.from_name, "sent an image"]
          payload[:kind] == "file" -> [payload.from_name, "uploaded a file"]
          payload[:msg] == nil -> [payload.from_name, "sent you a message"]
          true -> [payload.from_name, payload[:msg]]
        end
      _ ->
        cond do
          payload[:kind] == "image" -> [payload[:context], "#{payload.from_name} sent an image"]
          payload[:kind] == "file" -> [payload[:context], "#{payload.from_name} uploaded a file"]
          payload[:msg] == nil -> [payload[:context], "#{payload.from_name} sent a message"]
          true -> [payload[:context], "#{payload.from_name} #{payload[:msg]}"]
        end
    end

    alert = %{ title: title, body: msg }

    Enum.each(list_active_tokens(user), fn p ->
      topic = getTopic(p.type)
      case p.type do
        "apn-voip" -> :ok

        "apn" ->
          case payload.type do
            "call" -> :ok
            _ ->
              n = APNS.Notification.new(alert, p.token, topic)
              |> APNS.Notification.put_category(payload.type)
              |> APNS.Notification.put_custom(Utils.atoms_to_keys(payload))
              |> APNS.Notification.put_sound(payload[:sound] || "default")

              # `:on_response` callback for async pushes.
              if !async do
                res = Pigeon.APNS.push(n)
                if res.response != :success, do: Logger.info(inspect(res))
              else
                on_response = fn(res) -> if res.response != :success, do: Logger.info(inspect(res)) end
                Pigeon.APNS.push(n, on_response: on_response)
              end
            end

        "fcm" ->
            # The key should not be a reserved word ("from" or any word starting with "google" or "gcm").
            data = case payload[:from] do
              nil -> payload
              _ -> Map.put(payload, :from_uuid, Map.get(payload, :from)) |> Map.delete(:from)
            end

            n = FCM.Notification.new(p.token)
            |> FCM.Notification.put_restricted_package_name(topic)
            |> FCM.Notification.put_notification(Utils.atoms_to_keys(alert))
            |> FCM.Notification.put_data(Utils.atoms_to_keys(data))

            # `:on_response` callback for async pushes.
            if !async do
              res = Pigeon.FCM.push(n)
              if res.status != :success, do: Logger.info(inspect(res))
            else
              on_response = fn(res) -> if res.status != :success, do: Logger.info(inspect(res)) end
              Pigeon.FCM.push(n, on_response: on_response)
            end
      end
    end)
  end

  def list_active_tokens(user) do
    Repo.all(from p in PushToken, where: p.user_id == ^user.id and is_nil(p.deleted_at))
  end

  def soft_delete(token) do
    update_push_token(token, %{ deleted_at: Timex.now })
  end

  def get_push_token_by_device_id(user, type, device_id) do
    Repo.one(from p in PushToken,
             where: p.user_id == ^user.id and
               p.type == ^type and
               p.device_id == ^device_id,
             limit: 1)
  end

  @doc """
  Returns the list of push_tokens.

  ## Examples

      iex> list_push_tokens()
      [%PushToken{}, ...]

  """
  def list_push_tokens do
    Repo.all(PushToken)
  end

  @doc """
  Gets a single push_tokens.

  Raises `Ecto.NoResultsError` if the Push tokens does not exist.

  ## Examples

      iex> get_push_tokens!(123)
      %PushToken{}

      iex> get_push_tokens!(456)
      ** (Ecto.NoResultsError)

  """
  def get_push_token!(id), do: Repo.get!(PushToken, id)

  @doc """
  Creates a push_token.

  ## Examples

      iex> create_push_token(%{field: value})
      {:ok, %PushToken{}}

      iex> create_push_token(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_push_token(attrs \\ %{}) do
    %PushToken{}
    |> PushToken.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a push_token.

  ## Examples

      iex> update_push_token(push_token, %{field: new_value})
      {:ok, %PushToken{}}

      iex> update_push_token(push_token, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_push_token(%PushToken{} = push_token, attrs) do
    push_token
    |> PushToken.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a push_token.

  ## Examples

      iex> delete_push_token(push_token)
      {:ok, %PushToken{}}

      iex> delete_push_token(push_token)
      {:error, %Ecto.Changeset{}}

  """
  def delete_push_token(%PushToken{} = push_token) do
    Repo.delete(push_token)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking push_token changes.

  ## Examples

      iex> change_push_token(push_token)
      %Ecto.Changeset{data: %PushToken{}}

  """
  def change_push_token(%PushToken{} = push_token, attrs \\ %{}) do
    PushToken.changeset(push_token, attrs)
  end
end
