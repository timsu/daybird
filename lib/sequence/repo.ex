defmodule Sequence.Repo do
  use Ecto.Repo,
    otp_app: :sequence,
    adapter: Ecto.Adapters.Postgres
end
