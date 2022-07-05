defmodule SequenceWeb.PageController do
  use SequenceWeb, :controller
  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Config, Invites, Teams, Meetings}

  @static_paths ~w(/ /terms /privacy /pricing /customers /worktogether /hybrid /newsletter)

  @static_path Path.join(:code.priv_dir(:sequence), "static")
  @static_filenames ~w(index terms privacy pricing customers worktogether hybrid)
    |> Enum.map(fn name -> {name, Path.join(@static_path, name <> ".html")} end)
    |> Enum.into(%{})
  @static_files @static_filenames
    |> Enum.map(fn {name, path} -> {name, File.read(path)} end)
    |> Enum.into(%{})

  @default_landing_meta %{
    "title" => "Work together, wherever you are."
  }

  @landing_titles %{
    "terms" => "Terms of Service",
    "privacy" => "Privacy Policy",
    "pricing" => "Pricing",
    "customers" => "Customers",
    "hybrid" => "Hybrid spaces - A window into your physical office",
    "newsletter" => "Newsletter - This week in hybrid",
  }

  @landing_descriptions %{
    "terms" => "",
    "privacy" => "",
    "hybrid" => "Be at the office, when you can't be at the office. Hybrid spaces helps you to bridge the gap between your remote and in-person teammates by enabling them to teleport around the office in one click.",
    "newsletter" => "Subscribe to get the latest hybrid work news, research and tech delivered to your inbox weekly.",
  }

  @social_images %{
    "hybrid" => "https://tandem.chat/meta/social-hybrid.jpg",
  }

  @social_urls %{
    "hybrid" => "https://tandem.chat/hybrid",
  }

  @rehydrate %{
    "pricing" => "landing.js"
  }

  def ip_to_bucket(conn, modulo) do
    Tuple.sum(conn.remote_ip) |> rem(modulo)
  end

  def index(conn, _params) do
    cond do
      conn.request_path in @static_paths ->
        filename = if conn.request_path == "/" do
          "index"
        else
          String.slice(conn.request_path, 1..-1)
        end
        # in dev mode, read dynamically from the file system
        static_file = if Sequence.dev?, do: File.read(Map.get(@static_filenames, filename) || ""), else: Map.get(@static_files, filename)
        is_marketing_site = conn.request_path == "/worktogether"

        meta = if String.contains?(conn.query_string, "utm_campaign") do
          landing_meta = Config.get(:landing_meta) || "{}"
          conn = Plug.Conn.fetch_query_params(conn)
          params = conn.query_params
          landing_meta_json = Jason.decode! landing_meta
          landing_meta_json[params["utm_campaign"]]
        end || @default_landing_meta

        page_title = Map.get(@landing_titles, filename)
        page_description = Map.get(@landing_descriptions, filename)
        social_image = Map.get(@social_images, filename)
        social_url = Map.get(@social_urls, filename)
        rehydrate = Map.get(@rehydrate, filename)

        with {:ok, file} <- static_file do
          file = if is_marketing_site do
            String.replace(file, "%%page-title%%", meta["title"])
          else
            file
          end
          render conn, "raw.html", layout: {SequenceWeb.LayoutView, "landing.html"},
            html: file, title: page_title, description: page_description, social_image: social_image,
            social_url: social_url, js: rehydrate
        else
          _ -> render conn, "landing.html", layout: {SequenceWeb.LayoutView, "landing.html"},
            meta: meta, title: page_title, description: page_description, social_image: social_image, social_url: social_url
        end
      String.match?(conn.request_path, ~r/.*\.js$/) ->
        conn |> put_status(404) |> json(%{ not_found: true })
      true ->
        render conn, "landing.html", layout: {SequenceWeb.LayoutView, "landing.html"}
    end
  end

  def app(conn, _params) do
    render conn, "react.html", js: "appMain.js", intercom: true, desktop: true, tensorflow: true
  end

  def app_panel(conn, _params) do
    render conn, "react.html", js: "appPanel.js", desktop: true, tensorflow: true, twilio: true
  end

  def app_tooltip(conn, _params) do
    text conn, "NOP"
  end

  def app_onboarding(conn, _params) do
    render conn, "react.html", js: "appOnboarding.js", desktop: true
  end

  def app_auth(conn, _params) do
    render conn, "react.html", js: "auth.js", intercom: true, layout: {SequenceWeb.LayoutView, "landing.html"}
  end

  def app_chat(conn, _params) do
    text conn, "NOP"
  end

  def app_command(conn, _params) do
    text conn, "NOP"
  end

  def app_settings(conn, _params) do
    render conn, "react.html", js: "appSettings.js", desktop: true, tensorflow: true
  end

  def app_call_stats(conn, _params) do
    render conn, "react.html", js: "appCallStats.js", desktop: true
  end

  def app_whiteboard(conn, _params) do
    render conn, "react.html", js: "whiteboard.js", desktop: true
  end

  def app_web(conn, _params) do
    render conn, "react.html", js: "webApp.js", desktop: true, tensorflow: true, intercom: true, twilio: true
  end

  def web_call(conn, _params) do
    render conn, "react.html", js: "webCall.js", desktop: true, tensorflow: true, intercom: true, twilio: true
  end

  def test_call(conn, _params) do
    render conn, "react.html", js: "testCall.js", desktop: true, tensorflow: true
  end

  def workbench(conn, _params) do
    render conn, "react.html", js: "workbench.js", desktop: true
  end

  def admin(conn, _params) do
    render conn, "react.html", js: "admin.js"
  end

  def analytics(conn, _params) do
    render conn, "react.html", js: "analysis.js"
  end

  def invite(conn, %{ "code" => code }) do
    case Invites.invite_by_code!(code) do
      {:ok, invite} ->
        team = Teams.get_team! invite.team_id
        render conn, "react.html", title: "Join #{team.name} on Tandem", js: "auth.js",
          intercom: true, layout: {SequenceWeb.LayoutView, "landing.html"}
      _ ->
        render conn, "react.html", title: "This Tandem invite link is invalid", js: "auth.js", intercom: true
    end
  end

  def room_link(conn, _params) do
    render conn, "react.html", title: "Visit space", js: "webCall.js", intercom: true, desktop: true,
      tensorflow: true
  end

  def meeting(conn, %{ "code" => code }) when is_binary(code) do
    title = with {:ok, meeting_invite} <- Meetings.invite_by_code(code),
                 true <- is_map(meeting_invite) do
      "Join Meeting #{meeting_invite.meeting.title} on Tandem"
    else
      _ -> "Join Meeting"
    end
    render conn, "react.html", title: title, js: "webCall.js", intercom: true, desktop: true,
      tensorflow: true, layout: {SequenceWeb.LayoutView, "landing.html"}
  end

  def download(conn, %{ "os" => os }) do
    link = Config.get("tandem_" <> os)
    if link do
      redirect conn, external: link
    else
      {:error, :not_found}
    end
  end

  def health(conn, _) do
    case Sequence.Repo.db_status do
      :ok -> text conn, "OK"
      _ -> put_status(conn, :service_unavailable) |> text("ERROR")
    end
  end

  def maintenance(conn, _) do
    render conn, "maintenance.html"
  end

  def docs(conn, params) do
    if params["path"] == "index.html" do
      put_status(conn, 404) |> text("NOT FOUND")
    else
      redirect conn, to: "/docs/index.html"
    end
  end

  def not_found(conn, _) do
    conn
    |> put_status(404)
    |> json(%{ not_found: true })
  end

  def redirect_about(conn, _) do
    redirect conn, external: "https://www.notion.so/The-Tandem-team-8cb4e5817ddc43e9922b788395681a5b"
  end

  def redirect_faq(conn, _) do
    redirect conn, external: "https://www.notion.so/Tandem-FAQ-d699668c3c494193895f8a90633a0fd0"
  end

  def redirect_press(conn, _) do
    redirect conn, external: "https://www.notion.so/Tandem-Press-Kit-e81fed8256d64fbc85c2b2a6a3d7955d"
  end

  def redirect_chrome(conn, _) do
    redirect conn, external: "https://www.notion.so/Tandem-For-Chrome-5f0826297e2c4de88acaf40a2b848e30"
  end

  def redirect_jobs(conn, _) do
    redirect conn, external: "https://www.notion.so/Tandem-is-Hiring-31790502dbcb46ed95573012604b19a5"
  end

  def redirect_help_center(conn, _) do
    redirect conn, external: "https://blog.tandem.chat/support-home"
  end

  def redirect_privacy_statement(conn, _) do
    redirect conn, external: "https://www.notion.so/tandemchat/Privacy-7c3989c1c3f74e449bc3a4a39f8e97e2"
  end

  def redirect_best_practices(conn, _) do
    redirect conn, external: "https://blog.tandem.chat/support/feature-guide-and-demos/"
  end

  def redirect_product_updates(conn, _) do
    redirect conn, external: "https://blog.tandem.chat/tag/product-updates/"
  end

  def redirect_follow_us(conn, _) do
    redirect conn, external: "https://www.notion.so/tandemchat/Follow-Tandem-abb54dfaa94642d6abb1f7fcaa6b291a"
  end

  def redirect_youtube_channel(conn, _) do
    redirect conn, external: "https://www.youtube.com/channel/UCgM3EHWOg9PmugF33UNV99A?sub_confirmation=1"
  end

  def redirect_remote_guide(conn, _) do
    redirect conn, external: "https://www.notion.so/tandemchat/Guide-to-going-remote-f5321849634f4183ad8944ee79f9e0a0"
  end

  def redirect_linux_faq(conn, _) do
    redirect conn, external: "https://www.notion.so/tandemchat/Tandem-Linux-FAQ-d1a0f583ac9340cfb4d8eccbdc012bc1"
  end

  def redirect_blog(conn, _) do
    redirect conn, external: "https://blog.tandem.chat"
  end

  def redirect_kiosk(conn, _) do
    redirect conn, external: "/app/kiosk"
  end

  def redirect_spaces(conn, _) do
    redirect conn, external: "/auth/spaces"
  end

  def redirect_signup(conn, _) do
    redirect conn, external: "/auth/signup"
  end

  def empty_source_map(conn, _) do
    json conn, %{
      version: 3,
      file: "out.js",
      sourceRoot: "",
      sources: ["foo.js", "bar.js"],
      names: ["src", "maps", "are", "fun"],
      mappings: "AAgBC,SAAQ,CAAEA"
    }
  end

end
