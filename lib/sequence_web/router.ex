defmodule SequenceWeb.Router do

  # If you need to debug something happening in a pipeline, just add this plug
  defmodule ConnInterceptor do
    def init(default), do: default

    def call(conn, _default) do
      IO.inspect(conn)
    end
  end

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
      only: ~w(css images files js sounds videos app_status models favicon.ico meta robots.txt version.json appData.json apple-app-site-association)
    )

    plug(
      Plug.Static,
      at: "/", from: :sequence,
      gzip: true,
      cache_control_for_etags: "public, max-age=31536000",
      only: ~w(fonts)
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

  pipeline :docs do
    plug :accepts, ["html"]

    plug Sequence.Auth.Pipeline
    plug Guardian.Plug.VerifyCookie
    plug Guardian.Plug.EnsureAuthenticated

    plug Plug.Static, at: "/", from: :sequence, only: ~w(docs)
  end

  # API scope
  scope "/api/v1", SequenceWeb do
    pipe_through :api
    pipe_through :logging

    post "/magic_link", AuthController, :magic_link
    post "/log_in_else_sign_up_magic_link", AuthController, :log_in_else_sign_up_magic_link
    post "/log_in_else_sign_up_oauth", AuthController, :log_in_else_sign_up_oauth
    post "/forgot_password", AuthController, :forgot_password
    post "/reset_password", AuthController, :reset_password
    get "/analyze_email", AuthController, :analyze_email
    post "/exchange_token", AuthController, :exchange_token

    get "/valid_invite", InvitesController, :valid_invite
    post "/log_join_event", InvitesController, :log_join_event

    post "/log_error", LogController, :log_error
    post "/log_feedback", LogController, :log_feedback
    post "/log_events", LogController, :log_events

    post "/submit_survey", SurveysController, :submit_survey
    post "/add_to_newsletter", SurveysController, :add_to_newsletter

    get "/downloads", ConfigController, :downloads
    get "/turn_servers", ConfigController, :turn_servers
    get "/jitsi_servers", ConfigController, :jitsi_servers
    post "/reload", ConfigController, :reload
    get "/version", ConfigController, :version
    get "/app_version", ConfigController, :app_version
    get "/oauth_profile", ConfigController, :oauth_profile
    get "/time", ConfigController, :time
    get "/ion_config", ConfigController, :ion_config
    post "/reload_team", ConfigController, :reload_team
    get "/product_updates", ConfigController, :product_updates

    post "/slack/users", SlackController, :users
    post "/slack/oauth_team", SlackController, :oauth_team
    post "/slack/oauth_user", SlackController, :oauth_user_login
    post "/slack/invite", SlackController, :invite
    post "/slack/action", SlackController, :action_callback
    post "/slack/slash", SlackController, :slash_command

    post "/images/profile_picture", StorageController, :upload_profile_picture
    post "/chat/attachment", StorageController, :upload_attachment
    post "/calls/background", StorageController, :upload_background

    resources "/meeting_invites", MeetingInvitesController, only: [:show]

    post "/gcal/oauth/token", AuthController, :oauth_token
    post "/oauth/v2/token", AuthController, :oauth_token

    get "/room_links/:id/info", RoomLinksController, :room_link_info
    get "/recordings/playlist/:id", RecordingsController, :playlist

    get "/calls/dial_in", CallsController, :check_dial_in
    post "/calls/dial_in", CallsController, :set_dial_in
    post "/calls/dial_out", CallsController, :dial_out
    post "/calls/remove_dial_in_user", CallsController, :remove_dial_in_user
    get "/calls/phone_numbers", CallsController, :phone_numbers

    pipe_through :authenticated

    get "/oauth/v2/authorize", AuthController, :oauth_authorize

    post "/images/app_icon", StorageController, :upload_app_icon
    post "/spotify/connect", OAuthController, :connect_spotify
    post "/oauth/connect", OAuthController, :connect_service
    put "/oauth/token", OAuthController, :update_service_token
    post "/oauth/exchange", OAuthController, :exchange_token

    get "/user", AuthController, :fetch_user
    put "/user", AuthController, :update_user
    post "/join_invite", AuthController, :join_invite
    post "/verify_email", AuthController, :verify_email
    post "/login_success", AuthController, :login_success
    post "/download_reminder", AuthController, :download_reminder

    resources "/teams", TeamsController
    get "/domain_info", TeamsController, :domain_info
    post "/teams/:id/leave", TeamsController, :leave
    post "/teams/:id/join", TeamsController, :join
    put "/teams/:id/settings", TeamsController, :update_settings
    post "/teams/create", TeamsController, :create_team
    get "/teams/:id/buckets", TeamsController, :buckets
    put "/teams/:id/members/:user_id", TeamsController, :update_member
    delete "/teams/:id/members/:user_id", TeamsController, :remove_member

    post "/files/send", StorageController, :send_file
    post "/logs/upload_call", StorageController, :send_call_log
    post "/logs/upload_user", StorageController, :send_user_log
    post "/logs/uploaded", UploadedLogsController, :uploaded
    get "/logs/list", UploadedLogsController, :list
    get "/logs/feedback", UploadedLogsController, :list_feedback
    put "/logs/feedback/:id", UploadedLogsController, :update_feedback
    get "/logs/view", UploadedLogsController, :view_log

    resources "/rooms", RoomsController
    put "/rooms/:id/join", RoomsController, :join
    put "/rooms/:id/leave", RoomsController, :leave
    put "/rooms/:id/mute", RoomsController, :mute
    put "/rooms/:id/unmute", RoomsController, :unmute
    post "/rooms/:id/add_members", RoomsController, :add_members
    post "/rooms/:id/remove_member", RoomsController, :remove_member
    put "/rooms/:id/enter", RoomsController, :enter
    get "/team_room_bssids", RoomsController, :team_room_bssids
    get "/rooms/:id/room_bssids", RoomsController, :room_bssids
    put "/rooms/:id/set_room_bssids", RoomsController, :set_room_bssids
    resources "/room_links", RoomLinksController

    get "/chat/unread", ChatController, :unread
    delete "/chat/unread", ChatController, :update_unread
    post "/chat/wave", ChatController, :wave

    post "/invite", InvitesController, :get_invite
    post "/invite_copied", InvitesController, :invite_copied
    post "/new_invite", InvitesController, :new_invite
    post "/new_user_emails", InvitesController, :new_user_emails

    post "/slack/connect_user", SlackController, :connect_user
    post "/slack/connect_user_and_team", SlackController, :connect_user_and_team
    post "/slack/connect_team", SlackController, :connect_user_and_team # Backwards compatibility, or do we even need this if the app update gets bundled into this release?
    post "/slack/ping", SlackController, :ping
    post "/slack/update_profile", SlackController, :update_profile
    get "/slack/unlinked_users", SlackController, :unlinked_users
    post "/slack/link_user", SlackController, :link_user
    post "/slack/deauthorize", SlackController, :deauthorize

    get "/meetings/info", MeetingsController, :info
    resources "/meetings", MeetingsController
    post "/meetings/remove", MeetingsController, :remove_member
    post "/meetings/join_call", MeetingsController, :join_call
    post "/meetings/leave_call", MeetingsController, :leave_call
    post "/meetings/refresh", MeetingsController, :refresh

    resources "/meeting_invites", MeetingInvitesController, except: [:update, :show]

    resources "/leads", LeadController, except: [:new, :edit, :create]
    post "/leads/invite/:id", LeadController, :invite

    resources "/device_users", DeviceUsersController
    post "/device_users/:id/login", DeviceUsersController, :login

    post "/submit_pmf_survey", PmfSurveyController, :submit_pmf_survey

    # deprecated, used until Oct 2019
    get "/spotify/token", OAuthController, :get_spotify_token
    post "/spotify/refresh", OAuthController, :refresh_spotify_token

    get "/oauth/token", OAuthController, :get_service_token
    delete "/oauth/token", OAuthController, :delete_service_token
    post "/oauth/refresh", OAuthController, :refresh_service_token

    get "/calendar/ical", UserDataController, :get_ical
    get "/calendar/ical/events", UserDataController, :ical_events
    post "/calendar/ical", UserDataController, :update_ical

    get "/presence/team", PresenceController, :team_presence
    post "/presence/user", PresenceController, :update_presence

    put "/machine", ConfigController, :update_machine
    post "/clear_flags", ConfigController, :clear_flags
    post "/log_call_event", LogController, :log_call_event
    post "/log_call_events", LogController, :log_call_events
    post "/log_call_stats", LogController, :log_call_stats
    post "/log_user_call", LogController, :log_user_call
    post "/log_call_feedback", LogController, :log_call_feedback
    post "/log_unanswered_call", LogController, :log_unanswered_call
    post "/log_user_funnel_event", LogController, :log_user_funnel_event

    get "/telemetry/upload_url", TelemetryController, :upload_url
    get "/telemetry/call_stats", TelemetryController, :call_stats
    post "/telemetry/call_stats", TelemetryController, :upload_call_stats
    get "/telemetry/recent_calls", TelemetryController, :recent_calls

    get "/get_surveys", SurveysController, :get_surveys

    get "/app_definitions", AppDefinitionsController, :app_definitions
    post "/app_definition", AppDefinitionsController, :create_app_definition
    put "/app_definitions/:id", AppDefinitionsController, :update_app_definition
    delete "/app_definitions/:id", AppDefinitionsController, :delete_app_definition
    put "/toggle_app_setting", AppDefinitionsController, :toggle_app_setting

    get "/users/data", UserDataController, :get_user_data
    post "/users/data", UserDataController, :set_user_data

    get "/admin/is_admin", AdminController, :is_admin
    post "/admin/all_teams", AdminController, :all_teams
    get "/admin/teams/:id", AdminController, :team_user
    get "/admin/live_view", AdminController, :live_view
    get "/admin/events", AdminController, :events
    post "/admin/delete_user", AdminController, :delete_user
    post "/admin/update_user_email", AdminController, :update_user_email
    post "/admin/delete_team", AdminController, :delete_team
    get "/admin/retention", AdminController, :retention
    get "/admin/retention/teams", AdminController, :retention_teams
    post "/admin/toggle_feedback", AdminController, :toggle_feedback
    post "/admin/delete_slack_user", AdminController, :delete_slack_user
    post "/admin/unlink_user", AdminController, :unlink_user
    post "/admin/get_invite", AdminController, :get_invite
    get "/admin/experiments", AdminController, :get_experiments
    post "/admin/update_buckets", AdminController, :update_buckets
    post "/admin/merge_teams", AdminController, :merge_teams
    put "/admin/ion_config", AdminController, :update_ion_config
    get "/admin/landing_meta", AdminController, :get_landing_meta
    put "/admin/landing_meta", AdminController, :update_landing_meta
    post "/admin/disconnect_slack_team", AdminController, :disconnect_slack_team
    post "/admin/update_org", AdminController, :update_org
    post "/admin/admin_user", AdminController, :admin_user

    get "/analysis/can_view", AnalyticsController, :can_view
    get "/analysis/query", AnalyticsController, :query
    get "/analysis/okrs", AnalyticsController, :okrs

    get "/tester/is_tester", TesterController, :is_tester
    post "/tester/delete_user", TesterController, :delete_user
    post "/tester/delete_slack_user", TesterController, :delete_slack_user

    post "/send_invites", InvitesController, :send_invites

    post "/mobile/register_token", MobileController, :register_token
    post "/mobile/unregister_token", MobileController, :unregister_token
    get "/mobile/active_tokens", MobileController, :active_tokens
    post "/mobile/call_user", MobileController, :call_user
    get "/mobile/call_info", MobileController, :call_info
    post "/mobile/notify", MobileController, :notify

    get "/sounds", ConfigController, :sounds
    put "/sounds", ConfigController, :set_sounds

    resources "/recordings", RecordingsController
    post "/recordings/clips/:id", RecordingsController, :create_clip
    post "/recordings/events/:id", RecordingsController, :create_event
    post "/recordings/ended/:id", RecordingsController, :end_recording

    get "/subinfo", BillingController, :info
    get "/billing/info", BillingController, :info
    post "/billing/new", BillingController, :new
    post "/billing/manage", BillingController, :manage
  end

  # Web scope (skipping logging)
  scope "/", SequenceWeb do
    pipe_through :browser

    get "/health", PageController, :health

    # electron 6 has weird source map behavior
    get "/Users/*path", PageController, :empty_source_map
    get "/Applications/*path", PageController, :empty_source_map
    get "/private/*path", PageController, :empty_source_map

    pipe_through :testing

    get "/test/call", PageController, :test_call
    get "/workbench/*path", PageController, :workbench

    get "/topics", TopicsController, :index
    get "/topics/:topic", TopicsController, :show
  end

  scope "/", Bamboo do
    pipe_through :logging
    pipe_through :testing

    forward "/sent_emails", SentEmailViewerPlug
    forward "/sent_emails_api", SentEmailApiPlug
  end

  scope "/api/v1", SequenceWeb do
    pipe_through :logging
    pipe_through :testing
    pipe_through :api

    post "/tester/create_test_users", TesterController, :create_test_users
    post "/tester/delete_test_users", TesterController, :delete_test_users
    post "/tester/create_test_meeting", TesterController, :create_test_meeting

    get "/cypress_data/:key", TesterController, :cypress_data
    delete "/cypress_data", TesterController, :delete_cypress_data
    get "/quit", TesterController, :quit
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
    post "/call_session", CallsController, :call_session
    post "/call_token", CallsController, :call_token
    post "/calls/uuid_room", CallsController, :uuid_room
    post "/calls/daily_room", CallsController, :daily_room
    put "/calls/daily_room", CallsController, :update_daily_room
    delete "/calls/daily_room", CallsController, :delete_daily_room
    post "/calls/daily_token", CallsController, :daily_token
    post "/calls/ion_token", CallsController, :ion_token
    post "/calls/ice", CallsController, :ice_servers
    post "/push_context", CallsController, :push_context
    post "/calls/tw_token", CallsController, :tw_token
    post "/calls/extend_room", CallsController, :extend_room
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

  scope "/", SequenceWeb do
    pipe_through :logging
    post "/meetings/watch", MeetingsController, :watch
  end

  scope "/docs", SequenceWeb do
    pipe_through :docs
    get "/*path", PageController, :docs
  end

  # Disable csrf for twilio
  scope "/twilio", SequenceWeb do
    pipe_through :logging
    get "/incoming", TwilioCallController, :incoming
    get "/meeting", TwilioCallController, :meeting
    get "/status", TwilioCallController, :status
  end

  # Web scope
  scope "/", SequenceWeb do
    pipe_through :browser
    pipe_through :logging

    get "/app/main", PageController, :app
    get "/app/panel", PageController, :app_panel
    get "/app/tooltip", PageController, :app_tooltip
    get "/app/onboarding", PageController, :app_onboarding
    get "/app/settings/*path", PageController, :app_settings
    get "/app/chat", PageController, :app_chat
    get "/app/command", PageController, :app_command
    get "/app/call_stats", PageController, :app_call_stats
    get "/app/web/*path", PageController, :app_web
    get "/app/kiosk/*path", PageController, :app_web
    get "/whiteboard", PageController, :app_whiteboard

    get "/web/*path", PageController, :web_call

    get "/call/*path", PageController, :app_auth
    get "/m/call/*path", PageController, :app_auth
    get "/welcome/*path", PageController, :app_auth
    get "/auth/*path", PageController, :app_auth
    get "/extension/*path", PageController, :app_auth
    get "/login", PageController, :app_auth
    get "/admin/*path", PageController, :admin
    get "/tester/*path", PageController, :admin
    get "/oauth/google", OAuthController, :google_oauth
    get "/oauth/*path", PageController, :app_auth

    get "/slack", PageController, :app_auth

    get "/j/:code", PageController, :invite
    get "/room/:code", PageController, :room_link
    get "/meet/:code", PageController, :meeting
    get "/m/meet/:code", PageController, :meeting
    get "/r/:code", PageController, :room_link
    get "/kiosk", PageController, :redirect_kiosk
    get "/device_users", PageController, :redirect_spaces
    get "/spaces", PageController, :redirect_spaces
    get "/recordings/:code", PageController, :web_call

    get "/analytics/*path", PageController, :analytics

    get "/download/:os", PageController, :download
    get "/downloadv3/:os", PageController, :download

    get "/about", PageController, :redirect_about
    get "/faq", PageController, :redirect_faq
    get "/press", PageController, :redirect_press
    get "/chrome", PageController, :redirect_chrome
    get "/jobs", PageController, :redirect_jobs
    get "/help_center", PageController, :redirect_help_center
    get "/privacy_statement", PageController, :redirect_privacy_statement
    get "/follow_us", PageController, :redirect_follow_us
    get "/product_updates", PageController, :redirect_product_updates
    get "/best_practices", PageController, :redirect_best_practices
    get "/youtube_channel", PageController, :redirect_youtube_channel
    get "/remote-guide", PageController, :redirect_remote_guide
    get "/linux_faq", PageController, :redirect_linux_faq
    get "/blog", PageController, :redirect_blog

    get "/maintenance", PageController, :maintenance

    get "/signup", PageController, :redirect_signup
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
