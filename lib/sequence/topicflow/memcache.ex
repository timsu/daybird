defmodule Sequence.Topicflow.Memcache do
  require Logger

  @key_exists "Key exists"
  @key_not_found "Key not found"
  @connection_number 32
  @connections Enum.map(0..(@connection_number - 1), &:"topicflow_memcache_#{&1}")
  @impossible_cas 18_446_744_073_709_551_615

  @type key() :: binary
  @type data() :: any

  def enabled? do
    true
  end

  @spec connections :: [atom, ...]
  def connections do
    @connections
  end

  def impossible_cas do
    @impossible_cas
  end

  @spec connection_for_key(key()) :: atom
  def connection_for_key(key) do
    Enum.at(@connections, :erlang.phash2(key, @connection_number))
  end

  @spec update(key(), data(), integer) ::
          {:ok, integer} | {:conflict, data(), integer} | {:error, atom | binary, integer}
  def update(id, data, cas) do
    if enabled?() do
      case Memcache.set_cas(connection_for_key(id), id, data, cas, cas: true) do
        {:ok, _} = r ->
          Logger.debug("TOPIC UPDATED #{id}")

          r

        {:error, @key_not_found} ->
          case Memcache.set(connection_for_key(id), id, data, cas: true) do
            {:ok, _} = r ->
              Logger.debug("TOPIC UPDATED NOT FOUND #{id}")

              r

            error ->
              error
          end

        {:error, @key_exists} ->
          case Memcache.get(connection_for_key(id), id, cas: true) do
            {:ok, data, cas} ->
              Logger.debug("TOPIC UPDATE CONFLICT #{id}")

              {:conflict, data, cas}

            {:error, @key_not_found} ->
              case Memcache.add(connection_for_key(id), id, data, cas: true) do
                {:ok, _} = r ->
                  Logger.debug("TOPIC UPDATED BY ADDING #{id}")

                  r

                {:error, @key_exists} ->
                  Logger.debug("TOPIC UPDATE ALREADY EXISTS RETRY #{id}")

                  update(id, data, cas)

                {:error, reason} ->
                  {:error, reason, @impossible_cas}
              end

            {:error, reason} ->
              {:error, reason, @impossible_cas}
          end

        {:error, reason} ->
          {:error, reason, @impossible_cas}
      end
    else
      {:ok, @impossible_cas}
    end
  end

  @spec retrieve(key(), (data() | nil -> data() | nil)) ::
          {:ok, data(), integer} | {:error, atom | binary, data(), integer}
  def retrieve(
        id,
        data_f
      ) do
    if enabled?() do
      case Memcache.get(connection_for_key(id), id, cas: true) do
        {:ok, data, _} = r ->
          data = data_f.(data)

          if data != nil do
            {:ok, cas} = Memcache.set(connection_for_key(id), id, data, cas: true)

            Logger.debug("TOPIC RETRIEVED WITH OVERWRITTING #{id}")

            {:ok, data, cas}
          else
            Logger.debug("TOPIC RETRIEVED #{id}")

            r
          end

        {:error, @key_not_found} ->
          data = data_f.(nil)

          case Memcache.add(connection_for_key(id), id, data, cas: true) do
            {:error, @key_exists} ->
              Logger.debug("TOPIC RETRIEVE ALREADY EXISTS RETRY #{id}")

              retrieve(id, data_f)

            {:ok, cas} ->
              Logger.debug("TOPIC RETRIEVED BY ADDING #{id}")

              {:ok, data, cas}

            {:error, reason} ->
              {:error, reason, data, @impossible_cas}
          end

        {:error, reason} ->
          data = data_f.(nil)

          {:error, reason, data, @impossible_cas}
      end
    else
      data = data_f.(nil)
      {:ok, data, @impossible_cas}
    end
  end
end
