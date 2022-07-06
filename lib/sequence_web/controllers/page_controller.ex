defmodule SequenceWeb.PageController do
  use SequenceWeb, :controller
  action_fallback SequenceWeb.FallbackController

  alias Sequence.{Config, Invites, Teams}

  def index(conn, _params) do
    render conn, "landing.html", layout: {SequenceWeb.LayoutView, "landing.html"},
      js_path: SequenceWeb.PageView.js_path(conn, "/js/landing.js")
  end

  def app(conn, _params) do
    render conn, "react.html", js: "appMain.js", intercom: true, desktop: true, tensorflow: true
  end

  def admin(conn, _params) do
    render conn, "react.html", js: "admin.js"
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

  def redirect_blog(conn, _) do
    redirect conn, external: "https://blog.tandem.chat"
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
