defmodule Sequence.OAuthTokens do
  @moduledoc """
  The OAuthTokens context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.OAuthTokens.OAuthToken

  @doc """
  Returns the list of oauth_tokens.

  ## Examples

      iex> list_oauth_tokens()
      [%OAuthToken{}, ...]

  """
  def list_oauth_tokens do
    Repo.all(OAuthToken)
  end

  @doc """
  Gets a single oauth_token.

  Raises `Ecto.NoResultsError` if the O auth token does not exist.

  ## Examples

      iex> get_oauth_token!(123)
      %OAuthToken{}

      iex> get_oauth_token!(456)
      ** (Ecto.NoResultsError)

  """
  def get_oauth_token!(id), do: Repo.get!(OAuthToken, id)

  @doc """
  Creates a oauth_token.

  ## Examples

      iex> create_oauth_token(%{field: value})
      {:ok, %OAuthToken{}}

      iex> create_oauth_token(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_oauth_token(attrs \\ %{}) do
    %OAuthToken{}
    |> OAuthToken.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a oauth_token.

  ## Examples

      iex> update_oauth_token(oauth_token, %{field: new_value})
      {:ok, %OAuthToken{}}

      iex> update_oauth_token(oauth_token, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_oauth_token(%OAuthToken{} = oauth_token, attrs) do
    oauth_token
    |> OAuthToken.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a oauth_token.

  ## Examples

      iex> delete_oauth_token(oauth_token)
      {:ok, %OAuthToken{}}

      iex> delete_oauth_token(oauth_token)
      {:error, %Ecto.Changeset{}}

  """
  def delete_oauth_token(%OAuthToken{} = oauth_token) do
    Repo.delete(oauth_token)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking oauth_token changes.

  ## Examples

      iex> change_oauth_token(oauth_token)
      %Ecto.Changeset{data: %OAuthToken{}}

  """
  def change_oauth_token(%OAuthToken{} = oauth_token, attrs \\ %{}) do
    OAuthToken.changeset(oauth_token, attrs)
  end
end
