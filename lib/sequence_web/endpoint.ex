defmodule SequenceWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :sequence

  socket "/socket", SequenceWeb.UserSocket,
    websocket: [
      check_origin: false
    ]

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  # Set :encryption_salt if you would also like to encrypt it.
  @session_options [
    store: :cookie,
    key: "_sequence_key",
    signing_salt: "02K4RB43"
  ]

  socket "/live", Phoenix.LiveView.Socket, websocket: [connect_info: [session: @session_options]]

  # Serve at "/" the static files from "priv/static" directory.
  #
  # You should set gzip to true if you are running phoenix.digest
  # when deploying your static files in production.
  plug Plug.Static,
    at: "/",
    from: :sequence,
    gzip: true,
    only: ~w(assets js css images favicon.ico robots.txt sitemap.xml manifest.json serviceworker.js)

  plug Plug.Static,
    at: "/", from: :sequence,
    gzip: true,
    cache_control_for_etags: "public, max-age=31536000",
    only: ~w(fonts)

  plug Plug.Static,
    at: "/", from: :sequence,
    gzip: true,
    cache_control_for_etags: "public, max-age=604800",
    only: ~w(assets)

  plug Plug.Static, at: "/media", from: "media/"

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    # disable phoenix live reloading in favor of vite hot reloading
    # socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    # plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :sequence
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]


  # Since Plug.Parsers removes the raw request_body in body_parsers
  # we need to parse out the Stripe webhooks before this
  plug Stripe.WebhookPlug,
    at: "/webhook/stripe",
    handler: Sequence.StripeHandler,
    secret: {Application, :get_env, [:stripity_stripe, :signing_secret]}

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    length: 30 * 0x100000 # 30 MB

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options

  plug CORSPlug

  plug SequenceWeb.Router

  @doc """
  Callback invoked for dynamically configuring the endpoint.

  It receives the endpoint configuration and checks if
  configuration should be loaded from the system environment.
  """
  @impl true
  def init(_key, config) do
    if config[:load_from_system_env] do
      port = System.get_env("PORT") || raise "expected the PORT environment variable to be set"
      {:ok, Keyword.put(config, :http, [:inet6, port: port])}
    else
      {:ok, config}
    end
  end


end
