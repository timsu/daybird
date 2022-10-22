defmodule Sequence do
  @moduledoc """
  Sequence keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  def version(app \\ :sequence) do
    Application.loaded_applications
    |> Enum.filter(&(elem(&1, 0) == app))
    |> List.first
    |> elem(2)
    |> to_string
  end

  def env do
    cond do
      dogfood?() -> "dogfood"
      staging?() -> "staging"
      prod?() -> "prod"
      dev?() -> "dev"
      test?() -> "test"
      true -> "unknown"
    end
  end

  def prod? do
    Application.get_env(:sequence, :prod) && !staging?()
  end

  def staging? do
    Application.get_env(:sequence, :staging) == "true" or Application.get_env(:sequence, :staging) == "dogfood"
  end

  def dogfood? do
    Application.get_env(:sequence, :staging) == "dogfood"
  end

  def dev? do
    Application.get_env(:sequence, :dev)
  end

  def test? do
    Application.get_env(:sequence, :test)
  end

  def server? do
    Phoenix.Endpoint.server?(:sequence, SequenceWeb.Endpoint)
  end

  def base_url do
    cond do
      Sequence.dev? || Sequence.test? -> System.get_env("BASE_URL") || "http://#{stem_url()}"
      true -> "https://#{stem_url()}"
    end
  end

  def stem_url do
    cond do
      Sequence.dev? -> System.get_env("STEM_URL") || "localhost:4000"
      Sequence.test? -> System.get_env("STEM_URL") || "localhost:4002"
      Sequence.dogfood? -> "dogfood.daybird.app"
      Sequence.staging? -> "staging.daybird.app"
      true -> "daybird.app"
    end
  end

end
