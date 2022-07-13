defmodule SequenceWeb.ErrorView do
  use SequenceWeb, :view
  require Logger

  def render("400.json", %{message: message}) do
    %{ error: %{ message: message, resend: false } }
  end

  def render("400.json", _) do
    %{ error: %{ message: "Bad request - invalid parameters supplied", resend: false } }
  end

  def render("404.json", _) do
    %{ error: %{ message: "Not found", resend: false } }
  end

  def render("500.html", %{ message: message }) do
    "<html><body>#{message}</body></html>"
  end

  def render("500.json", %{ message: message }) do
    %{ error: %{ message: message, resend: false } }
  end

  def render("500.json", _) do
    %{ error: %{ message: "Internal server error", resend: false } }
  end

  # By default, Phoenix returns the status message from
  # the template name. For example, "404.html" becomes
  # "Not Found".
  def template_not_found(template, _assigns) do
    Phoenix.Controller.status_message_from_template(template)
  end

end
