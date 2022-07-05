defmodule SequenceWeb.AssertNotProd do
  require Logger
  import Plug.Conn
  import Phoenix.Controller, only: [put_view: 2, render: 2]

  alias SequenceWeb.ErrorView

  @behaviour Plug

  def init(opts), do: opts

  def assert_not_prod do
    !Sequence.prod?
  end

  def call(conn, _opts) do
    if assert_not_prod() do
      conn
    else
      conn |> put_status(:not_found) |> put_view(ErrorView) |> render(:"404") |> halt()
    end
  end
end
