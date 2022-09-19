defmodule SequenceWeb.DocChannel do
  use Phoenix.Channel

  alias Sequence.{Cache}

  @cache_table :docdata

  def join("doc:" <> filename, _auth_msg, socket) do
    send(self(), :after_join)
    {:ok, assign(socket, :filename, filename)}
  end

  def handle_info(:after_join, socket) do
    send_cache socket, "selection"
    send_cache socket, "cursor"

    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    clear_cache socket, "selection"
    clear_cache socket, "cursor"

    :ok
  end

  def handle_in("load", _, socket) do
    #{:ok, pid} = DocRegistry.load_doc(filename(socket))

    contents = "" # Document.get_contents(pid)
    {:reply, {:ok, %{ contents: contents }}, socket}
  end

  def handle_in("delta", %{ "version" => _version, "delta" => delta }, socket) do
    # {:ok, pid} = DocRegistry.load_doc(filename(socket))

    # TODO: do operational transform
    version = delta # Document.update(pid, delta)
    # case OT.receive_delta(user_uuid(socket), doc_id(socket), version, text_delta) do
    #   {:ok, version, delta} ->
    #     broadcast! socket, "delta", %{ userId: user_uuid(socket),
    #       clientId: client_id(socket), version: version, delta: delta }
    #     {:reply, {:ok, %{ version: version }}, socket}
    #   {:error, reason} ->
    #     {:reply, {:ok, %{ error: reason }}, socket}
    {:reply, {:ok, %{ version: version }}, socket}
  end

  # def handle_in("selection", %{"range" => range}, socket) do
  #   params = %{ userId: user_uuid(socket), clientId: client_id(socket), range: range }
  #   broadcast! socket, "selection", params
  #   put_cache socket, "selection", params

  #   {:noreply, socket}
  # end

  # def handle_in("cursor", params, socket) do
  #   params = Map.merge(params, %{ userId: user_uuid(socket), clientId: client_id(socket) })
  #   broadcast! socket, "cursor", params

  #   if Map.has_key?(params, "scroll") do
  #     put_cache socket, "cursor", params
  #   end

  #   {:noreply, socket}
  # end

  ### private helpers

  defp cache_key(socket, type), do: "#{filename(socket)}:#{type}"

  # defp put_cache(socket, type, data) do
  #   key = cache_key(socket, type)
  #   map = (Cache.get(@cache_table, key) || %{})
  #   |> Map.put(client_id(socket), data)
  #   Cache.set(@cache_table, key, map)
  # end

  defp send_cache(socket, type) do
    key = cache_key(socket, type)
    (Cache.get(@cache_table, key) || %{})
    |> Enum.each(fn {_, update} ->
      push socket, type, update
    end)
  end

  defp clear_cache(socket, type) do
    key = cache_key(socket, type)
    map = Cache.get(@cache_table, key) || %{}
    if Map.has_key? map, client_id(socket) do
      map = Map.delete(map, client_id(socket))
      Cache.set(@cache_table, key, map)
    end
  end

  defp filename(socket), do: socket.assigns.filename

  defp client_id(socket), do: socket.assigns.client_id

end
