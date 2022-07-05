defmodule Sequence.Topicflow.Topic do
  use GenServer

  alias Sequence.Topicflow.{Registry, Topic, Session, Memcache}
  alias Sequence.Topicflow.System, as: TFSystem
  alias Sequence.Utils

  require Logger

  @idle_period 24 * 3_600 * 1_000
  @verify_snapshot_period 60 * 1_000

  defmodule Data do
    alias Sequence.Topicflow.Topic.Data

    # *** WARNING ***
    #
    # This struct is persisted to memcache as an erlang structure,
    # so if you change it you will have to account for existing data
    # that might not match.
    #
    # *** WARNING ***
    defstruct [:epoch, shared_data: %{}, grouped_datasets: %{}]

    @spec make(atom()) :: %Sequence.Topicflow.Topic.Data{
            epoch: binary,
            grouped_datasets: %{},
            shared_data: %{}
          }
    def make(module) do
      epoch =
        if :erlang.function_exported(module, :make_epoch, 0) do
          apply(module, :make_epoch, [])
        else
          random_epoch()
        end

      %Data{epoch: epoch}
    end

    defp random_epoch do
      :crypto.strong_rand_bytes(16) |> Base.url_encode64()
    end
  end

  defstruct id: nil,
            module: nil,
            state: nil,
            data: nil,
            verify_data: nil,
            verify_ref: nil,
            verify_snapshot_timer_ref: nil,
            verify_ignore_presence_keys: [],
            cas: nil,
            session_pids_refs: [],
            expire_timer_ref: nil

  def child_spec(args) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [args]},
      restart: :temporary
    }
  end

  def start_link(sup_args, server_args) do
    topic_id = Keyword.fetch!(server_args, :id)

    true = :global.set_lock({topic_id, self()})

    r = GenServer.start_link(__MODULE__, Keyword.merge(sup_args, server_args),
      name: {:via, Registry, topic_id}
    )
    true = :global.del_lock({topic_id, self()})

    r
  end

  def cast_subscribe(server, request_id, session_pid) do
    GenServer.cast(server, {:subscribe, {request_id, session_pid}})
  end

  def cast_unsubscribe(server, session_pid) do
    GenServer.cast(server, {:unsubscribe, session_pid})
  end

  def cast_set_keys_no_reply(server, group, keys_values_ttls, ts \\ server_ts()) do
    bulk = Enum.map(keys_values_ttls, fn {key, {value, ttl}} -> {key, {value, ttl}, ts} end)
    cast_set_keys_bulk_no_reply(server, group, bulk)
  end

  def cast_set_keys_bulk(server, request_ids, session_pid, group, bulk) do
    GenServer.cast(server, {:set_keys, {request_ids, session_pid}, group, bulk})
  end

  def cast_set_keys_bulk_no_reply(server, group, bulk) do
    GenServer.cast(server, {:set_keys, nil, group, bulk})
  end

  def cast_topic_verify_reply(server, ref, snapshot, client_id, user_id) do
    GenServer.cast(server, {:topic_verify_reply, ref, snapshot, client_id, user_id})
  end

  def cast_test_force_conflict(server) do
    GenServer.cast(server, :test_force_conflict)
  end

  def cast_set_key_on_topic(id, key, value, ttl \\ nil) do
    case Registry.whereis_name(id) do
      :undefined -> throw({:badarg, {id, key}})
      pid -> cast_set_keys_no_reply(pid, nil, [{key, {value, ttl}}])
    end
  end

  def cast_clear_keys(
        server,
        request_id,
        session_pid,
        group,
        prefix \\ "",
        except_keys \\ [],
        ts \\ server_ts()
      ) do
    GenServer.cast(
      server,
      {:clear_keys, {[request_id], session_pid}, group, prefix, except_keys, ts}
    )
  end

  def cast_clear_keys_no_reply(
        server,
        group,
        prefix \\ "",
        except_keys \\ [],
        ts \\ server_ts()
      ) do
    GenServer.cast(server, {:clear_keys, nil, group, prefix, except_keys, ts})
  end

  def get_topic_pid(topic_id) do
    case Topic.Supervisor.start_child(topic_id) do
      {:ok, topic_pid} ->
        {:ok, topic_pid}

      {:error, {:already_started, topic_pid}} ->
        {:ok, topic_pid}

      error ->
        error
    end
  end

  def valid_settable_key_prefix?(<<"@", _::binary>>), do: false
  def valid_settable_key_prefix?(_), do: true

  # Callbacks

  @impl true
  def init(args) do
    topic_id = Keyword.fetch!(args, :id)
    topic_modules = Keyword.fetch!(args, :topic_modules)

    Logger.debug("INIT TOPIC #{topic_id}")

    r =
      case Enum.find(topic_modules, fn {prefix, _, _} -> String.starts_with?(topic_id, prefix) end) do
        {_, nil, options} ->
          {:ok, nil, nil, options}

        {_, module, options} ->
          if :erlang.function_exported(module, :init, 1) do
            case apply(module, :init, [topic_id]) do
              {:ok, state} ->

                if :erlang.function_exported(module, :retrieve_shared_bulk, 1) do
                  {shared_bulk, state} = apply(module, :retrieve_shared_bulk, [state])

                  {expire_keys_ttls_tss, _, shared_data} = set_keys(%{}, shared_bulk)

                  :ok = schedule_expire_keys(nil, expire_keys_ttls_tss)

                  {:ok, module, state, options, shared_data}
                else
                  {:ok, module, state, options}
                end

              {:error, _} = error ->
                error
            end
          else
            {:ok, module, nil, options}
          end

        nil ->
          {:ok, nil, nil, %{}}
      end

    r =
      case r do
        {:ok, module, state, options} ->
          # Non-persistent topic
          case Memcache.retrieve(topic_id, fn
                 %Data{shared_data: _, grouped_datasets: _} ->
                   # As is if found
                   nil

                 _ ->
                   # Make new empty data if not found or malformed data
                   Data.make(module)
               end) do
            {:ok, data, cas} ->
              {:ok, %Topic{id: topic_id, module: module, state: state, data: data, cas: cas}, options}

            {:error, reason, data, cas} ->
              Logger.error("ERROR RETRIEVING #{topic_id} FROM MEMCACHE #{inspect(reason)}")

              {:ok, %Topic{id: topic_id, module: module, state: state, data: data, cas: cas}, options}
          end

        {:ok, module, state, options, shared_data} ->
          # Persistent topic
          case Memcache.retrieve(topic_id, fn
                 %Data{shared_data: _, grouped_datasets: _} = data ->
                   # Overwrite persistent shared data if found
                   %{data | shared_data: shared_data}

                 _ ->
                   # Make new with persistent shared data if not found or
                   # malformed data
                   data = Data.make(module)
                   %{data | shared_data: shared_data}
               end) do
            {:ok, data, cas} ->
              {:ok, %Topic{id: topic_id, module: module, state: state, data: data, cas: cas}, options}

            {:error, reason, data, cas} ->
              Logger.error("ERROR RETRIEVING #{topic_id} FROM MEMCACHE #{inspect(reason)}")

              {:ok, %Topic{id: topic_id, module: module, state: state, data: data, cas: cas}, options}
          end

        error ->
          error
      end

    case r do
      {:ok, topic, options} ->

        {:ok, schedule_verify_snapshot(Map.merge(topic, options))}

      {:error, reason} ->
        {:stop, reason}
    end
  end

  @impl true
  def handle_cast(
        {:subscribe, {request_id, subscriber_session_pid}},
        %Topic{
          id: topic_id,
          data: %Data{epoch: epoch} = data,
          session_pids_refs: session_pids_refs
        } = topic
      ) do
    Logger.debug("SUBSCRIBE SESSION #{inspect(subscriber_session_pid)}")

    topic = cancel_expire(topic)

    topic =
      if Enum.any?(session_pids_refs, fn {session_pid, _} ->
           session_pid == subscriber_session_pid
         end) do
        topic
      else
        session_ref = Process.monitor(subscriber_session_pid)

        %{
          topic
          | session_pids_refs: [{subscriber_session_pid, session_ref} | session_pids_refs]
        }
      end

    :ok =
      Session.cast_reply_ack(
        subscriber_session_pid,
        request_id
      )

    :ok =
      Session.cast_topic_snapshot(subscriber_session_pid, topic_id, make_snapshot(data), epoch)

    {:noreply, topic}
  end

  @impl true
  def handle_cast(
        {:unsubscribe, unsubscribe_session_pid},
        %Topic{session_pids_refs: session_pids_refs} = topic
      ) do
    session_pids_refs =
      case session_pids_refs
           |> Enum.split_with(fn {session_pid, _} -> session_pid == unsubscribe_session_pid end) do
        {[{session_pid, session_ref} | _], session_pids_refs} ->
          Logger.debug("UNSUBSCRIBE SESSION #{inspect(session_pid)}")

          true = Process.demonitor(session_ref)

          session_pids_refs

        {_, session_pids_refs} ->
          session_pids_refs
      end

    topic =
      if session_pids_refs == [] do
        schedule_expire(topic)
      else
        topic
      end

    topic = %{topic | session_pids_refs: session_pids_refs}

    {:noreply, topic}
  end

  @impl true
  def handle_cast(
        {:set_keys, reply_to, nil, bulk} = m,
        %Topic{data: %Data{shared_data: shared_data} = data} = topic
      ) do
    {expire_keys_ttls_tss, keys_values_diff, shared_data} = set_keys(shared_data, bulk)

    case update_memcache(%{data | shared_data: shared_data}, topic) do
      {:ok, topic} ->
        :ok = broadcast_key_value_diff(topic, reply_to, keys_values_diff)
        :ok = schedule_expire_keys(nil, expire_keys_ttls_tss)
        {:noreply, topic}

      {:recast, topic} ->
        :ok = GenServer.cast(self(), m)
        {:noreply, topic}
    end
  end

  @impl true
  def handle_cast(
        {:set_keys, reply_to, group, bulk} = m,
        %Topic{data: %Data{grouped_datasets: grouped_datasets} = data} = topic
      ) do

    grouped_data = Map.get(grouped_datasets, group, %{})

    {expire_keys_ttls_tss, keys_values_diff, grouped_data} =
      set_keys(grouped_data, bulk)
      |> set_updated_key(topic.id)

    grouped_datasets = Map.put(grouped_datasets, group, grouped_data)

    case update_memcache(%{data | grouped_datasets: grouped_datasets}, topic) do
      {:ok, topic} ->
        :ok =
          broadcast_key_value_diff(
            topic,
            reply_to,
            grouped_keys_values_diff(keys_values_diff, group)
          )

        :ok = schedule_expire_keys(group, expire_keys_ttls_tss)

        {:noreply, topic}

      {:recast, topic} ->
        :ok = GenServer.cast(self(), m)
        {:noreply, topic}
    end
  end

  def handle_cast(
        {:clear_keys, reply_to, nil, prefix, except_keys, ts} = m,
        %Topic{data: %Data{shared_data: shared_data} = data} = topic
      ) do
    {keys_values_diff, shared_data} = clear_prefix(shared_data, prefix, except_keys, ts)

    case update_memcache(%{data | shared_data: shared_data}, topic) do
      {:ok, topic} ->
        :ok = broadcast_key_value_diff(topic, reply_to, keys_values_diff)

        {:noreply, topic}

      {:recast, topic} ->
        :ok = GenServer.cast(self(), m)
        {:noreply, topic}
    end
  end

  def handle_cast(
        {:clear_keys, reply_to, group, prefix, except_keys, ts} = m,
        %Topic{data: %Data{grouped_datasets: grouped_datasets} = data} = topic
      ) do
    grouped_data = Map.get(grouped_datasets, group, %{})

    {keys_values_diff, grouped_data} =
      clear_prefix(grouped_data, prefix, except_keys, ts)
      |> set_updated_key(topic.id)

    grouped_datasets = Map.put(grouped_datasets, group, grouped_data)

    case update_memcache(%{data | grouped_datasets: grouped_datasets}, topic) do
      {:ok, topic} ->
        :ok =
          broadcast_key_value_diff(
            topic,
            reply_to,
            grouped_keys_values_diff(keys_values_diff, group)
          )

        {:noreply, topic}

      {:recast, topic} ->
        :ok = GenServer.cast(self(), m)
        {:noreply, topic}
    end
  end

  def handle_cast(
        {:topic_verify_reply, ref, snapshot, _client_id, _user_id},
        %Topic{id: id, verify_ignore_presence_keys: ignored_keys,
          data: %Data{epoch: epoch} = data, verify_data: verify_data, verify_ref: ref} = topic
      ) do

    expected_snapshot = Utils.atoms_to_keys(make_snapshot(verify_data))
    found_snapshot = Utils.atoms_to_keys(snapshot)

    {expected, found} = Utils.deep_diff(
      expected_snapshot |> filter_snapshot(ignored_keys),
      found_snapshot |> filter_snapshot(ignored_keys))

    if expected != found do
      session_pid = Registry.whereis_name(ref)

      :ok = Session.cast_topic_snapshot(session_pid, id, make_snapshot(data), epoch)
    end

    {:noreply, topic}
  end

  def handle_cast(
        {:topic_verify_reply, _, _, _, _},
        topic
      ) do
    {:noreply, topic}
  end

  def handle_cast(
        :test_force_conflict,
        topic
      ) do
    {:noreply, %{topic | cas: Memcache.impossible_cas()}}
  end

  # Not sure why this is happening yet, but adding resilience
  def handle_cast( {:expire_key, _, _, _} = m, topic) do
    Logger.warn("TopicFlow :expire_key received as cast instead of info")
    handle_info(m, topic)
  end

  def handle_cast(_message, topic) do
    {:noreply, topic}
  end

  @impl true
  def handle_info(
        {:expire_key, nil, key, ts} = m,
        %Topic{data: %Data{shared_data: shared_data} = data} = topic
      ) do
    {_, keys_values_diff, shared_data} = set_keys(shared_data, [{key, :expire, ts}])

    case update_memcache(%{data | shared_data: shared_data}, topic) do
      {:ok, topic} ->
        :ok = broadcast_key_value_diff(topic, nil, keys_values_diff)

        {:noreply, topic}

      {:recast, topic} ->
        :ok = Process.send(self(), m, [])
        {:noreply, topic}
    end
  end

  def handle_info(
        {:expire_key, group, key, ts} = m,
        %Topic{data: %Data{grouped_datasets: grouped_datasets} = data} = topic
      ) do
    grouped_data = Map.get(grouped_datasets, group, %{})

    {[], keys_values_diff, grouped_data} =
      set_keys(grouped_data, [{key, :expire, ts}])
      |> set_updated_key(topic.id)

    grouped_datasets = Map.put(grouped_datasets, group, grouped_data)

    case update_memcache(%{data | grouped_datasets: grouped_datasets}, topic) do
      {:ok, topic} ->
        :ok =
          broadcast_key_value_diff( topic, nil, grouped_keys_values_diff(keys_values_diff, group))

        {:noreply, topic}

      {:recast, topic} ->
        :ok = Process.send(self(), m, [])
        {:noreply, topic}
    end
  end

  def handle_info(
        {:DOWN, _, :process, down_session_pid, _},
        %Topic{session_pids_refs: session_pids_refs} = topic
      ) do
    Logger.debug("SESSION DOWN #{inspect(down_session_pid)}")

    session_pids_refs =
      Enum.reject(session_pids_refs, fn {session_pid, _} ->
        down_session_pid == session_pid
      end)

    topic =
      if session_pids_refs == [] do
        schedule_expire(topic)
      else
        topic
      end

    {:noreply, %{topic | session_pids_refs: session_pids_refs}}
  end

  def handle_info(:expire, %Topic{id: id} = topic) do
    Logger.debug("TOPIC EXPIRED #{id}")

    {:stop, {:shutdown, :expired}, topic}
  end

  def handle_info(:verify_snapshot, %Topic{id: _id, data: data} = topic) do
    verify_ref = UUID.uuid1()

    :ok = broadcast_verify_snapshot(topic, verify_ref)

    {:noreply, schedule_verify_snapshot(%{topic | verify_data: data, verify_ref: verify_ref})}
  end

  def handle_info(
        _,
        %Topic{module: nil} = topic
      ) do
    {:noreply, topic}
  end

  def handle_info(
        message,
        %Topic{
          module: module,
          state: state,
          data: %Data{shared_data: shared_data, grouped_datasets: grouped_datasets}
        } = topic
      ) do
    state = apply(module, :handle_info, [message, state, shared_data, grouped_datasets])
    {:noreply, %{topic | state: state}}
  end

  @impl true
  def handle_call(:inspect, _from, %Topic{data: data} = topic) do
    {:reply, data, topic}
  end

  def server_ts do
    :os.system_time(:microsecond)
  end

  defp grouped_key(group, key) do
    "@#{group}:#{key}"
  end

  defp clear_prefix(data, prefix, except_keys, ts) do
    keys_to_clear =
      data
      |> Map.keys()
      |> Enum.filter(&String.starts_with?(&1, prefix))

    keys_to_clear = keys_to_clear -- except_keys

    bulk =
      keys_to_clear
      |> Enum.map(fn key -> {key, {nil, nil}, ts} end)

    {[], keys_values_diff, data} = set_keys(data, bulk)
    {keys_values_diff, data}
  end

  defp set_keys(data, bulk) do

    # TODO: remove tombstones older than oldest disconnected session
    Enum.reduce(bulk, {[], %{}, data}, fn {key, payload, ts},
                                          {expire_keys_ttls_tss, keys_values_diff, data} ->
      {current_value, current_ts} =
        case Map.get(data, key) do
          {value, ts, _} -> {value, ts}
          nil -> {nil, nil}
        end

      case payload do
        :expire ->
          if ts == current_ts do
            {expire_keys_ttls_tss,
             if(current_value == nil,
               do: keys_values_diff,
               else: Map.put(keys_values_diff, key, nil)
             ), Map.put(data, key, {nil, ts, false})}
          else
            {expire_keys_ttls_tss, keys_values_diff, data}
          end

        {value, ttl} ->
          if current_ts == nil or ts > current_ts do
            expire_keys_ttls_tss =
              if ttl != nil do
                [{key, ttl, ts} | expire_keys_ttls_tss]
              else
                expire_keys_ttls_tss
              end

            keys_values_diff =
              if value == current_value do
                keys_values_diff
              else
                Map.put(keys_values_diff, key, value)
              end

            data = Map.put(data, key, {value, ts, ttl != nil})

            {expire_keys_ttls_tss, keys_values_diff, data}
          else
            {expire_keys_ttls_tss, keys_values_diff, data}
          end

        {:add, insert, ttl} ->
          if current_ts == nil or ts > current_ts do
            expire_keys_ttls_tss =
              if ttl != nil do
                [{key, ttl, ts} | expire_keys_ttls_tss]
              else
                expire_keys_ttls_tss
              end

            case add_value(insert, current_value) do
              :invalid ->
                {expire_keys_ttls_tss, keys_values_diff, data}
              value ->
                keys_values_diff =
                  if value == current_value do
                    keys_values_diff
                  else
                    Map.put(keys_values_diff, key, value)
                  end

                data = Map.put(data, key, {value, ts, ttl != nil})

                {expire_keys_ttls_tss, keys_values_diff, data}
            end
          else
            {expire_keys_ttls_tss, keys_values_diff, data}
          end

        {:subtract, drop, ttl} ->
          if current_ts == nil or ts > current_ts do
            expire_keys_ttls_tss =
              if ttl != nil do
                [{key, ttl, ts} | expire_keys_ttls_tss]
              else
                expire_keys_ttls_tss
              end

              case subtract_value(drop, current_value) do
                :invalid ->
                  {expire_keys_ttls_tss, keys_values_diff, data}
                value ->
                  keys_values_diff =
                    if value == current_value do
                      keys_values_diff
                    else
                      Map.put(keys_values_diff, key, value)
                    end

                  data = Map.put(data, key, {value, ts, ttl != nil})

                  {expire_keys_ttls_tss, keys_values_diff, data}
              end
          else
            {expire_keys_ttls_tss, keys_values_diff, data}
          end
      end
    end)
  end

  defp broadcast_key_value_diff(_, nil, keys_values_diff) when map_size(keys_values_diff) == 0 do
    :ok
  end

  defp broadcast_key_value_diff(
         _,
         {request_ids, reply_to_session_pid},
         keys_values_diff
       )
       when map_size(keys_values_diff) == 0 do
    Session.cast_reply_acks(reply_to_session_pid, request_ids)
  end

  defp broadcast_key_value_diff(
         %Topic{id: topic_id, session_pids_refs: session_pids_refs},
         {request_ids, reply_to_session_pid},
         keys_values_diff
       ) do
    :ok = Session.cast_reply_acks(reply_to_session_pid, request_ids)

    Enum.each(session_pids_refs, fn {session_pid, _} ->
      :ok = Session.cast_topic_diff(session_pid, topic_id, keys_values_diff)
    end)
  end

  defp broadcast_key_value_diff(
         %Topic{id: topic_id, session_pids_refs: session_pids_refs},
         nil,
         keys_values_diff
       ) do
    Enum.each(session_pids_refs, fn {session_pid, _} ->
      :ok = Session.cast_topic_diff(session_pid, topic_id, keys_values_diff)
    end)
  end

  defp broadcast_snapshot(
         %Topic{id: topic_id, session_pids_refs: session_pids_refs},
         snapshot,
         epoch
       ) do
    Enum.each(session_pids_refs, fn {session_pid, _} ->
      :ok = Session.cast_topic_snapshot(session_pid, topic_id, snapshot, epoch)
    end)
  end

  defp broadcast_verify_snapshot(
         %Topic{id: topic_id, session_pids_refs: session_pids_refs},
         verify_ref
       ) do
    Enum.each(session_pids_refs, fn {session_pid, _} ->
      :ok = Session.cast_topic_verify_request(session_pid, topic_id, verify_ref)
    end)
  end

  defp schedule_expire_keys(_, []) do
    :ok
  end

  defp schedule_expire_keys(group, expire_keys_ttls_tss) do
    expire_keys_ttls_tss
    |> Enum.each(fn {key, ttl, ts} ->
      _ = Process.send_after(self(), {:expire_key, group, key, ts}, ttl)
    end)
  end

  defp grouped_keys_values_diff(keys_values_diff, group) do
    keys_values_diff
    |> Enum.map(fn {key, value} -> {grouped_key(group, key), value} end)
    |> Map.new()
  end

  def set_updated_key({_, keys_values_diff, _} = msg, _topic_id)
    when keys_values_diff == %{} do
    msg
  end

  def set_updated_key({expire_keys_ttls_tss, keys_values_diff, grouped_data}, topic_id) do
    {keys_values_diff, grouped_data} =
      set_updated_key({keys_values_diff, grouped_data}, topic_id)

    {expire_keys_ttls_tss, keys_values_diff, grouped_data}
  end

  def set_updated_key({keys_values_diff, grouped_data}, topic_id) do
    ts = :os.system_time(:microsecond)
    if TFSystem.send_presence(topic_id) do
      {Map.put(keys_values_diff, "updated", ts), Map.put(grouped_data, "updated", {ts, ts, false})}
    else
      {keys_values_diff, grouped_data}
    end
  end

  defp schedule_expire(%Topic{} = topic) do
    %{topic | expire_timer_ref: Process.send_after(self(), :expire, @idle_period)}
  end

  defp schedule_verify_snapshot(%Topic{} = topic) do
    %{
      topic
      | verify_snapshot_timer_ref:
          Process.send_after(self(), :verify_snapshot, @verify_snapshot_period)
    }
  end

  defp cancel_expire(%Topic{expire_timer_ref: nil} = topic) do
    topic
  end

  defp cancel_expire(%Topic{expire_timer_ref: expire_timer_ref} = topic) do
    _ = Process.cancel_timer(expire_timer_ref)
    %{topic | expire_timer_ref: nil}
  end

  defp make_snapshot(%Data{shared_data: shared_data, grouped_datasets: grouped_datasets}) do
    grouped_snapshot =
      grouped_datasets
      |> Enum.map(fn {user_id, data} ->
        data
        |> Enum.map(fn {key, {value, _, _}} -> {key, value} end)
        |> Enum.reject(fn {_, value} -> value == nil end)
        |> Enum.map(fn {key, value} -> {grouped_key(user_id, key), value} end)
      end)
      |> Enum.concat()
      |> Map.new()

    shared_data
    |> Enum.map(fn {key, {value, _, _}} -> {key, value} end)
    |> Enum.reject(fn {_, value} -> value == nil end)
    |> Map.new()
    |> Map.merge(grouped_snapshot)
  end

  defp filter_snapshot(%{} = data, ignored) do

    test = fn {key, _value} ->
      Enum.any?(ignored, fn ignored_key ->
        String.starts_with?(key, "@p:") && String.ends_with?(key, ":#{ignored_key}")
      end)
    end

    data
    |> Enum.reject(test)
    |> Enum.into(%{})
  end

  defp filter_snapshot(data, _ignored) do
    Logger.error("Bad snapshot data", data)
    data
  end

  defp update_memcache(new_data, %Topic{id: topic_id, cas: prev_cas} = topic) do
    case Memcache.update(topic_id, non_transient_data(new_data), prev_cas) do
      {:ok, new_cas} ->
        {:ok, %{topic | data: new_data, cas: new_cas}}

      {:conflict, %Data{epoch: conflict_epoch} = conflict_data, conflict_cas} ->
        topic = %{topic | data: conflict_data, cas: conflict_cas}
        conflict_snapshot = make_snapshot(conflict_data)

        :ok = broadcast_snapshot(topic, conflict_snapshot, conflict_epoch)
        {:recast, topic}

      {:error, reason, new_cas} ->
        Logger.error("ERROR UPDATING #{topic_id} IN MEMCACHE #{inspect(reason)}")
        {:ok, %{topic | data: new_data, cas: new_cas}}
    end
  end

  defp non_transient_data(%Data{shared_data: shared_data, grouped_datasets: grouped_datasets} = data) do
    %{
      data
      | shared_data: non_transient_keys(shared_data),
        grouped_datasets:
          Enum.map(grouped_datasets, fn {group, data} -> {group, non_transient_keys(data)} end)
          |> Map.new()
    }
  end

  defp non_transient_keys(data) do
    data
    |> Enum.reject(fn {_, {_, _, transient}} -> transient end)
    |> Map.new()
  end

  defp add_value({value, index}, nil) when is_number(index) do
    [value]
  end

  defp add_value({value, key}, nil) when is_binary(key) do
    %{ key => value }
  end

  defp add_value({value, index}, nil) when is_nil(index) do
    value
  end

  defp add_value({value, index}, current_value) when is_list(current_value) and is_number(index) do
    if index < length(current_value) do
      List.insert_at(current_value, index, value)
    else
      List.insert_at(current_value, -1, value)
    end
  end

  defp add_value({value, key}, current_value) when is_map(current_value) and is_binary(key) do
    Map.put(current_value, key, value)
  end

  defp add_value({value, _}, current_value) when is_number(current_value) do
    current_value + value
  end

  defp add_value(_, _), do: :invalid

  defp subtract_value({nil, index}, current_value) when is_list(current_value) do
    if index < length(current_value) do
      List.delete_at(current_value, index)
    else
      :invalid
    end
  end

  defp subtract_value({value, nil}, current_value) when is_list(current_value) do
    List.delete(current_value, value)
  end

  defp subtract_value({value, index}, current_value) when is_list(current_value) do
    if index < length(current_value) and Enum.at(current_value, index) == value do
      List.delete_at(current_value, index)
    else
      :invalid
    end
  end

  defp subtract_value({_, key}, current_value) when is_map(current_value) do
    Map.delete(current_value, key)
  end

  defp subtract_value({value, _}, current_value) when is_number(current_value) do
    current_value - value
  end

  defp subtract_value(_, _), do: :invalid

end
