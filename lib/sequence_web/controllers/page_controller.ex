defmodule SequenceWeb.PageController do
  use SequenceWeb, :controller
  action_fallback SequenceWeb.FallbackController

  def index(conn, _params) do
    render conn, "app.html", layout: {SequenceWeb.LayoutView, "landing.html"}, entry: "landing"
  end

  def app(conn, _params) do
    render conn, "app.html", entry: "app"
  end

  def insight(conn, _params) do
    render conn, "app.html", pwa: "/pwa-insight.json", entry: "insight", title: "InsightLoop"
  end

  def auth(conn, _params) do
    render conn, "app.html", entry: "auth"
  end

  def admin(conn, _params) do
    render conn, "app.html", entry: "admin"
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

end
