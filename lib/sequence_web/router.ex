defmodule SequenceWeb.Router do

  use SequenceWeb, :router
  use Plug.ErrorHandler

  import Plug.BasicAuth
  import Phoenix.LiveDashboard.Router

  pipeline :browser do
    plug :accepts, ["html"]

    plug :fetch_session
    plug :protect_from_forgery
    plug :put_secure_browser_headers

    # Serve at "/" the static files from "priv/static" directory.
    plug(
      Plug.Static,
      at: "/", from: :sequence,
      gzip: true,
      only: ~w(assets js css sounds favicon.ico robots.txt version.json pwa.json pwa-local.json serviceworker.js)
    )
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :user_or_guest do
    plug Sequence.Auth.Pipeline
    plug Guardian.Plug.EnsureAuthenticated, claims: %{"typ" => "access"}
  end

  pipeline :authenticated do
    plug Sequence.Auth.Pipeline
    plug Guardian.Plug.EnsureAuthenticated
  end

  pipeline :logging do
    plug SequenceWeb.RequestLogger
  end

  pipeline :validate_csrf do
    plug :fetch_session
    plug :protect_from_forgery
  end

  pipeline :testing do
    plug :accepts, ["html"]
    plug SequenceWeb.AssertNotProd
  end

  pipeline :dashboard do
    plug :basic_auth, username: "admin", password: "all good boys go to heaven"
  end

  # API scope
  scope "/api/v1", SequenceWeb do
    pipe_through :api
    pipe_through :logging

    post "/sign_in", AuthController, :sign_in
    post "/log_in_else_sign_up_oauth", AuthController, :log_in_else_sign_up_oauth
    post "/create_account", AuthController, :create_account
    post "/sign_in_oauth", AuthController, :sign_in_oauth
    post "/forgot_password", AuthController, :forgot_password
    post "/reset_password", AuthController, :reset_password
    post "/exchange_token", AuthController, :exchange_token

    get "/time", ConfigController, :time
    get "/githash", ConfigController, :githash

    get "/valid_invite", InvitesController, :valid_invite
    post "/log_join_event", InvitesController, :log_join_event

    post "/images/profile_picture", StorageController, :upload_profile_picture
    post "/attachments", StorageController, :upload_attachment
    get "/attachments/:user_id/:timestamp", StorageController, :get_attachment

    pipe_through :authenticated

    get "/user", AuthController, :fetch_user
    put "/user", AuthController, :update_user
    post "/join_invite", AuthController, :join_invite
    post "/verify_email", AuthController, :verify_email
    post "/login_success", AuthController, :login_success

    post "/oauth/connect", OAuthController, :connect_service
    post "/oauth/exchange", OAuthController, :exchange_token
    get "/oauth/token", OAuthController, :get_service_token
    put "/oauth/token", OAuthController, :update_service_token
    delete "/oauth/token", OAuthController, :delete_service_token
    post "/oauth/refresh", OAuthController, :refresh_service_token

    resources "/projects", ProjectsController
    post "/projects/:id/add_member", ProjectsController, :add_member
    post "/projects/:id/remove_member", ProjectsController, :remove_member

    resources "/tasks", TasksController

    get "/files", DocsController, :list_files
    post "/files", DocsController, :create_file
    put "/files/:id", DocsController, :update_file

    get "/doc", DocsController, :get_doc
    post "/doc", DocsController, :save_doc

    resources "/teams", TeamsController

    get "/domain_info", TeamsController, :domain_info
    post "/teams/:id/leave", TeamsController, :leave
    post "/teams/:id/join", TeamsController, :join
    put "/teams/:id/settings", TeamsController, :update_settings
    post "/teams/create", TeamsController, :create_team
    get "/teams/:id/buckets", TeamsController, :buckets
    put "/teams/:id/members/:user_id", TeamsController, :update_member
    delete "/teams/:id/members/:user_id", TeamsController, :remove_member

    get "/chat/unread", ChatController, :unread
    delete "/chat/unread", ChatController, :update_unread
    post "/chat/wave", ChatController, :wave

    post "/invite", InvitesController, :get_invite
    post "/invite_copied", InvitesController, :invite_copied
    post "/new_invite", InvitesController, :new_invite
    post "/new_user_emails", InvitesController, :new_user_emails

    get "/users/data", UserDataController, :get_user_data
    post "/users/data", UserDataController, :set_user_data

    get "/admin/is_admin", AdminController, :is_admin
    post "/admin/all_teams", AdminController, :all_teams
    get "/admin/teams/:id", AdminController, :team_user
    post "/admin/delete_user", AdminController, :delete_user
    post "/admin/update_user_email", AdminController, :update_user_email
    post "/admin/delete_team", AdminController, :delete_team
    post "/admin/unlink_user", AdminController, :unlink_user
    post "/admin/get_invite", AdminController, :get_invite
    post "/admin/merge_teams", AdminController, :merge_teams
    post "/admin/update_org", AdminController, :update_org
    post "/admin/admin_user", AdminController, :admin_user

    post "/send_invites", InvitesController, :send_invites

    post "/mobile/register_token", MobileController, :register_token
    post "/mobile/unregister_token", MobileController, :unregister_token
    get "/mobile/active_tokens", MobileController, :active_tokens
    post "/mobile/notify", MobileController, :notify

    get "/subinfo", BillingController, :info
    get "/billing/info", BillingController, :info
    post "/billing/new", BillingController, :new
    post "/billing/manage", BillingController, :manage
  end

  # Web scope (skipping logging)
  scope "/", SequenceWeb do
    pipe_through :browser

    get "/health", PageController, :health

    pipe_through :testing

    get "/topics", TopicsController, :index
    get "/topics/:topic", TopicsController, :show
  end

  scope "/api/v1", SequenceWeb do
    # endpoints available to regular users and meeting guests
    pipe_through :logging
    pipe_through :api
    pipe_through :user_or_guest

    get "/guest_info", TeamsController, :guest_info
    get "/chat/messages", ChatController, :messages
    post "/chat/message", ChatController, :post_message
    put "/chat/message", ChatController, :update_message
    delete "/chat/message", ChatController, :delete_message
  end

  scope "/api/v1", SequenceWeb do
    pipe_through :logging
    pipe_through :api

    get "/*path", ErrorHandler, :not_found
    post "/*path", ErrorHandler, :not_found
    put "/*path", ErrorHandler, :not_found
    delete "/*path", ErrorHandler, :not_found
  end

  scope "/" do
    pipe_through [:browser, :dashboard]
    live_dashboard "/dashboard", metrics: SequenceWeb.Telemetry
  end

  # Web scope
  scope "/", SequenceWeb do
    pipe_through :browser
    pipe_through :logging

    get "/app/*path", PageController, :app
    get "/insight/*path", PageController, :insight

    get "/signup", PageController, :auth
    get "/signin", PageController, :auth
    get "/forgot_password", PageController, :auth
    get "/reset_password", PageController, :auth

    get "/admin/*path", PageController, :admin

    get "/oauth/google", OAuthController, :google_oauth
    get "/oauth/*path", PageController, :auth

    get "/about", PageController, :redirect_about
    get "/faq", PageController, :redirect_faq
    get "/blog", PageController, :redirect_blog

    get "/maintenance", PageController, :maintenance

    # landing page
    get "/*path", PageController, :index
  end

  # Enables the Swoosh mailbox preview in development.
  #
  # Note that preview only shows emails that were sent by the same
  # node running the Phoenix server.
  if Mix.env() == :dev do
    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  def handle_errors(conn, data) do
    SequenceWeb.ErrorHandler.handle_errors(conn, data)
  end

end
