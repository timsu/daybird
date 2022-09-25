import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :sequence, Sequence.Repo,
  url: System.get_env("ECTO_TEST_URL") || "pg://localhost/sequence_test",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :sequence, SequenceWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "Y+0KMYlDaZwv4YaETH7NxQNBpPuj0pop5wqtL7BJDyYVs9ZtdCnMtYGEmO8neGBd",
  server: false

# In test we don't send emails.
config :sequence, Sequence.Mailer, adapter: Swoosh.Adapters.Test

# Print only warnings and errors during test
config :logger, level: :warn

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

config :sequence, topicflow_port: 7001
config :sequence, topicflow_disabled: true
