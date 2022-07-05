defmodule Sequence.Release do
  @app :sequence
  import Ecto.Query, warn: false

  def migrate do
    load_app()

    for repo <- repos() do
      _ = Ecto.Migrator.run(repo, :up, all: true)
    end
  end

  def rollback(repo, version) do
    load_app()
    _ = Ecto.Migrator.run(repo, :down, to: version)
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end
end
