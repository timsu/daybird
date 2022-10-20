defmodule Sequence.OAuthTokens do
  @moduledoc """
  The OAuthTokens context.
  """

  import Ecto.Query, warn: false
  alias Sequence.{Repo, Utils}

  alias Sequence.OAuthTokens.OAuthToken

  def find_for_user(user, name) do
    Repo.one(from t in OAuthToken, where: t.user_id == ^user.id and t.name == ^name and
      is_nil(t.deleted_at), order_by: [desc: :id], limit: 1)
  end

  def update_or_create_for_user_and_service(user, service, attrs) do
    case find_for_user(user, service) do
      nil ->
        create_oauth_token(attrs)
      token ->
        if token.meta["invalid_grant"] do
          attrs = Map.put(attrs, :meta, Utils.updated_meta_field(token.meta, %{ "invalid_grant" => false }))
          update_oauth_token(token, attrs)
        else
          update_oauth_token(token, attrs)
        end
    end
  end

  def refresh(token) do
    case get_service(token.name).refresh_token(token.refresh) do
      {:ok, result} ->
        expires_in = result["expires_in"]
        expires_at = Timex.shift(Timex.now, seconds: expires_in)
        meta = Utils.updated_meta_field(token.meta, %{ "invalid_grant" => false })
        update_oauth_token(token, %{
          access: result["access_token"],
          expires_at: expires_at,
          meta: meta
        })
      {:error, :google, 400, "invalid_grant"} ->
        meta = Map.put(token.meta || %{}, "invalid_grant", true)
        {:ok, token} = update_oauth_token(token, %{
          synced_at: Timex.shift(Timex.now, years: 1000), # this is a hack to prevent them getting pulled into a sync
          meta: meta
        })
        {:skip, token}
      other -> other
    end
  end

  def maybe_refresh(token) do
    cond do
      token.meta["invalid_grant"] -> refresh(token)
      is_nil(token.expires_at) || Timex.before?(token.expires_at, Timex.now()) -> refresh(token)
      true -> {:ok, token}
    end
  end

  def get_service(name) do
    case name do
      "google-cal" -> Sequence.Google
      "google-contacts" -> Sequence.Google
    end
  end

  def soft_delete_oauth_token(nil), do: :ok
  def soft_delete_oauth_token(oauth_token) do
    update_oauth_token(oauth_token, %{ deleted_at: Timex.now })
  end

  def list_oauth_tokens_by_name(name) do
    Repo.all(from o in OAuthToken, where: o.name == ^name and is_nil(o.deleted_at))
  end

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
