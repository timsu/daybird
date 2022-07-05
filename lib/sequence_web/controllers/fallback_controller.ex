defmodule SequenceWeb.FallbackController do
  @moduledoc """
  Translates controller action results into valid `Plug.Conn` responses.

  See `Phoenix.Controller.action_fallback/1` for more details.
  """
  use SequenceWeb, :controller
  require Logger

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(SequenceWeb.ChangesetView)
    |> render("error.json", changeset: changeset)
  end

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(404)
    |> put_view(SequenceWeb.ErrorView)
    |> render(:"404")
  end

  def call(conn, {:error, :unauthorized}) do
    call(conn, {:error, :unauthorized, "You are not authorized for that action. Try logging out and logging in again."})
  end

  def call(conn, {:error, :no_2fa}) do
    call(conn, {:error, :unauthorized, "Two-factor authentication has not been set up yet"})
  end

  def call(conn, {:error, :wrong_token}) do
    call(conn, {:error, :unauthorized, "The token you provided was wrong or expired, please try again."})
  end

  def call(conn, {:error, :invalid_token}) do
    call(conn, {:error, :unauthorized, "The token you provided was wrong or expired, please try again."})
  end

  def call(conn, {:error, :token_expired}) do
    call(conn, {:error, :unauthorized, "The token you provided was expired, please try again."})
  end

  def call(conn, {:error, status, message}) do
    conn
    |> put_status(status)
    |> put_view(SequenceWeb.ErrorView)
    |> render(:"400", %{ :message => message })
  end

  def call(conn, nil) do
    call(conn, {:error, :unauthorized, "You are not authorized for that action. Try logging out and logging in again."})
  end

  def call(conn, :ok) do
    conn
    |> json(%{ success: true })
  end

end
