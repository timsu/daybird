defmodule Sequence.MixProject do
  use Mix.Project

  def project do
    [
      app: :sequence,
      version: "1.0.0",
      elixir: "~> 1.12",
      elixirc_paths: elixirc_paths(Mix.env()),
      elixirc_options: [
        {:all_warnings, true},
        {:warnings_as_errors, Mix.env != :dev && Mix.env != :test}
      ],
      compilers: [:gettext] ++ Mix.compilers(),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      test_coverage: [tool: LcovEx, output: "cover"],
      dialyzer: [
        plt_core_path: "_build",
        plt_add_apps: [:ex_unit, :mix],
        ignore_warnings: ".dialyzer_ignore.exs"
      ],
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Sequence.Application, []},
      extra_applications: [
        :logger,
        :runtime_tools,
        :mojito,
      ]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.6.10"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.6"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_live_view, "~> 0.17.5"},
      {:phoenix_live_dashboard, "~> 0.6"},
      {:swoosh, "~> 1.3"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.18"},
      {:jason, "~> 1.2"},
      {:plug_cowboy, "~> 2.5"},

      {:timex, "~> 3.7", override: true},
      {:cors_plug, "~> 1.5"},
      {:guardian, "~> 2.2"},
      {:comeonin, "~> 5.3"},
      {:bcrypt_elixir, "~> 2.3"},
      {:cloak, "~> 1.1"},
      {:redix, "~> 1.1"},
      {:arc, "~> 0.11.0"},
      {:ex_aws, "~> 2.2"},
      {:ex_aws_s3, "~> 2.3"},
      {:libcluster, "~> 3.2.1"},
      {:oban, "~> 2.1"},
      {:csv, "~> 2.3"},
      {:stripity_stripe, "~> 2.0"},
      {:mint, "~> 1.4"},
      {:mojito, "~> 0.7"},
      {:email_checker, "~> 0.1.3"},
      {:memcachex, "~> 0.5.0"},
      {:pigeon, ">= 0.0.0"},
      {:kadabra, ">= 0.0.0"},
      {:uuid, "~> 1.1"},
      {:sweet_xml, "~> 0.0"},

      # dev dependencies
      {:mix_test_watch, "~> 0.6", only: [:dev, :docker], runtime: false},
      {:phoenix_live_reload, "~> 1.2", only: [:dev, :docker]},
      {:esbuild, "~> 0.4", runtime: Mix.env() == :dev},
      {:dialyxir, "~> 1.0", only: [:dev, :test], runtime: false},

      # test dependencies
      {:floki, ">= 0.30.0", only: :test},
      {:lcov_ex, "~> 0.2.0", only: :test, runtime: false},
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to create, migrate and run the seeds file at once:
  #
  #     $ mix ecto.setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate --quiet", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      "ecto.redo": ["ecto.rollback", "ecto.migrate"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
      seed: ["run priv/repo/seeds.exs"],
      "assets.deploy": ["esbuild default --minify", "phx.digest"]
    ]
  end
end
