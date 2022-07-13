defmodule Sequence.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false


  use Application

  @impl true
  def start(_type, _args) do
    topologies = [
      sequence: Application.get_env(:sequence, :cluster_topology)
    ]

    :hackney_pool.set_max_connections(:default, 1000)

    topic_modules = [
      {"contacts:", Sequence.Topics.ContactsTopic, %{}},
      {"rooms:", Sequence.Topics.RoomsTopic, %{}},
      {"user_settings:", Sequence.Topics.UserSettingsTopic, %{}},
      {"pong:", Sequence.Topicflow.Examples.PongTopic, %{}},
      {"test:", Sequence.Topicflow.Test.TestTopic, %{}},
      {"test_foobar:", Sequence.Topicflow.Test.PersistentTopic, %{}},
      {"rtc:", nil, %{ verify_ignore_presence_keys: ["stats", "context"] }},
      {"cursor:", nil, %{ verify_ignore_presence_keys: ["cursor"] }},
    ]

    # Define workers and child supervisors to be supervised
    children = [
      # cluster supervisor
      {Cluster.Supervisor, [topologies, [name: Sequence.ClusterSupervisor]]},

      # redis global instance
      {Redix, {Application.get_env(:sequence, :redis), [name: :redix]}},

      # Start the Ecto repository
      Sequence.Repo,
      Sequence.Vault,

      # Start the Telemetry supervisor
      SequenceWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: Sequence.PubSub},
      # Start the Endpoint (http/https)
      SequenceWeb.Endpoint,

      # Start your own worker by calling: Sequence.Worker.start_link(arg1, arg2, arg3)
      %{ id: Sequence.Cache, start: { Sequence.Cache, :start_link, [] } },
      %{ id: Sequence.Config, start: { Sequence.Config, :start_link, [] } },
      LogDNA.BatchLogger,

      (Sequence.test?() || Sequence.server?()) && {Sequence.Topicflow.Supervisor, [topic_modules: topic_modules]},

    ] |> Enum.reject(&(&1 == nil or &1 == false))

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Sequence.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SequenceWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  def asset_cache_bust do
    Phoenix.Config.clear_cache SequenceWeb.Endpoint
    Phoenix.Endpoint.Supervisor.warmup SequenceWeb.Endpoint
  end
end
