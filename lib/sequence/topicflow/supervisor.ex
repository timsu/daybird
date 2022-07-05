defmodule Sequence.Topicflow.Supervisor do
  use Supervisor

  alias Sequence.Topicflow.{Healthcheck, Socket, Session, Topic, Antientropy}

  @memcache_ttl 72 * 3_600

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(args) do
    port = Application.get_env(:sequence, :topicflow_port, 5100)
    topicflow_disabled = Application.get_env(:sequence, :topicflow_disabled, false)

    topic_modules = Keyword.fetch!(args, :topic_modules)

    children =
      [
        pg_sup(:topicflow_pg),
        pg_sup(:topicflow_pg_non_unique)
      ] ++
        memcache_workers() ++
        [
          Antientropy,
          Session.Supervisor,
          {Topic.Supervisor, [topic_modules: topic_modules]}
        ] ++ if(topicflow_disabled, do: [], else: [cowboy_sup(:topicflow_cowboy, port)])

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp pg_sup(id) do
    %{
      id: id,
      start: {:pg, :start_link, [id]},
      restart: :permanent,
      shutdown: :infinity,
      type: :supervisor
    }
  end

  defp cowboy_sup(id, port) do
    dispatch =
      :cowboy_router.compile([
        {:_,
         [
           {"/", Healthcheck, %{}},
           {"/topicflow/socket", Socket, %{}}
         ]}
      ])

    %{
      id: id,
      start: {:cowboy, :start_clear, [id, [port: port], %{env: %{dispatch: dispatch}}]},
      restart: :permanent,
      shutdown: :infinity,
      type: :supervisor
    }
  end

  defp memcache_workers do
    if Sequence.Topicflow.Memcache.enabled?() do
      Enum.map(Sequence.Topicflow.Memcache.connections(), &memcache_worker(&1))
    else
      []
    end
  end

  defp memcache_worker(id) do
    hostname = Application.get_env(:sequence, :topicflow_memcache_hostname, "localhost")

    opts = [
      hostname: hostname,
      namespace: "tf",
      ttl: @memcache_ttl,
      coder: {Memcache.Coder.Erlang, [:compressed]}
    ]

    %{
      id: id,
      start: {Memcache, :start_link, [opts, [name: id]]},
      restart: :permanent,
      shutdown: :infinity,
      type: :worker
    }
  end
end
