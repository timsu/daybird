defmodule Sequence.Users do
  @moduledoc """
  The Users context.
  """

  import Ecto.Query, warn: false
  alias Sequence.{Repo, Utils, Teams.UserTeam}

  alias Sequence.Users.{User, UserData, MagicLink}

  ### Authentication

  def by_uuid(uuids) when is_list(uuids) do
    Repo.all(from t in User, where: t.uuid in ^uuids)
  end

  def by_uuid(uuid) do
    Repo.one(from q in User, where: q.uuid == ^uuid)
  end

  def by_uuid!(uuid) do
    Repo.one!(from q in Sequence.Users.User, where: q.uuid == ^uuid)
  end

  def find_by_uuid(uuid) do
    user = Repo.get_by(User, uuid: uuid)
    if user, do: {:ok, user}, else: {:error, :not_found}
  end

  @spec find_by_email(String.t()) :: {:error, :not_found} | {:ok, User.t()}
  def find_by_email(nil), do: nil
  def find_by_email(email) do
    Repo.get_by(User, email: String.downcase(email)) |> Utils.ok_wrap({:error, :not_found})
  end

  @spec find_or_create_by_email(String.t(), map()) :: {:ok, User.t(), :created | :existing} | {:error, Ecto.Changeset.t()}
  def find_or_create_by_email(email, params) do
    case find_by_email(email) do
       {:ok, user} -> {:ok, user, :existing}
       _ ->
        with {:ok, user} <- create_user(params) do
          {:ok, user, :created}
        end
    end
  end

  def find_by_google_id(google_id) do
    user = Repo.get_by(User, google_id: google_id)
    if user, do: {:ok, user}, else: {:error, :not_found}
  end

  ### password auth

  def authenticate_user(email, given_password) do
    Repo.one(from u in User, where: u.email == ^String.downcase(email), limit: 1)
    |> check_password(given_password)
  end

  def check_password(nil, _), do: {:error, "Incorrect email or password"}

  def check_password(user, given_password) do
    case Bcrypt.verify_pass(given_password, user.password_hash) do
      true -> {:ok, user}
      false -> {:error, "Incorrect email or password"}
    end
  end

  ### magic link auth

  @magic_word_count 4
  @token_expires_in 600
  @token_expires_soon 120

  def gen_magic_link(user) when is_map(user) do
    # check if user already has code that won't expire soon
    now = System.os_time(:second)
    with magic_link when not is_nil(magic_link) <- find_magic_link_by_user_id(user.id) do
      with {:ok, {magic_words, date}} when
            now < date + @token_expires_in - @token_expires_soon <- Utils.decrypt(magic_link.body) do
        {magic_words, user}
      else
       _ ->
        make_new_magic_link(%{user_id: user.id}, now, user, magic_link)
      end
    else
      _ ->
        make_new_magic_link(%{user_id: user.id}, now, user)
    end
  end

  def gen_magic_link(email) when is_binary(email) do
    # check if user already has code that won't expire soon
    now = System.os_time(:second)
    with magic_link when not is_nil(magic_link) <- find_magic_link_by_email(email) do
      with {:ok, {magic_words, date}} when
            now < date + @token_expires_in - @token_expires_soon <- Utils.decrypt(magic_link.body) do
        {magic_words, nil}
      else
       _ ->
        make_new_magic_link(%{email: email}, now, nil, magic_link)
      end
    else
      _ ->
        make_new_magic_link(%{email: email}, now, nil)
    end
  end

  def make_new_magic_link(params, now, user, existing \\ nil, magic_words \\ nil) do
    if existing, do: {:ok, _} = delete_magic_link(existing)
    magic_words = magic_words || Utils.magic_words(@magic_word_count)
    code = {magic_words, now} |> Utils.encrypt
    {:ok, _magic_link} = create_magic_link(Map.merge(params, %{ body: code }))
    {magic_words, user}
  end

  def magic_link_authenticate(email, code) do
    user = find_user_by_email(email) |> Repo.preload(:primary_team)

    cond do
      (Sequence.dev? || Sequence.test?) && code == "dev" -> {:ok, user}
      user == nil -> check_magic_link(email, code)
      true -> check_magic_link(user, code)
    end
  end

  def check_magic_link(user, code) when is_map(user) do
    Repo.preload(user, :magic_link)
    |> Map.get(:magic_link)
    |> check_magic_link(code, user)
  end

  def check_magic_link(email, code) when is_binary(email) do
    find_magic_link_by_email(email)
    |> check_magic_link(code, nil)
  end

  defp check_magic_link(%MagicLink{body: body} = magic_link, code, user) do
    with {:ok, {magic_words, date}} <- Utils.decrypt(body) do
      cond do
        magic_words != code -> check_magic_link(nil, nil, nil)
        date + @token_expires_in < System.os_time(:second) -> check_magic_link(nil, nil, nil)
        true ->
          update_magic_link(magic_link, %{redeemed_at: System.os_time(:second)})
          {:ok, user}
      end
    end
  end

  defp check_magic_link(nil, _code, _user) do
    {:error, "That code is invalid or expired. Please check your email or try again."}
  end

  ### User data

  def get_user_data(user, key) do
    Repo.one(from ud in UserData, where: ud.user_id == ^user.id and ud.key == ^key and
      is_nil(ud.project_id), limit: 1)
  end

  def get_user_data(user, nil, key), do: get_user_data(user, key)

  def get_user_data(user, project, key) do
    Repo.one(from ud in UserData, where: ud.user_id == ^user.id and
      ud.key == ^key and ud.project_id == ^project.id, limit: 1)
  end

  def get_all_user_data(user) do
    Repo.all(from ud in UserData, where: ud.user_id == ^user.id and is_nil(ud.project_id))
  end

  ### user access

  def first_user do
    Repo.one(from u in User, order_by: [asc: :id], limit: 1)
  end

  def get_users(ids) do
    Repo.all(from u in User, where: u.id in ^ids)
  end

  # Gets users by uuid, ignoring any that are not in the specified team
  def get_users_by_uuid_in_team(uuids, team) do
    Repo.all(from u in User, join: ut in UserTeam, where: u.id == ut.user_id and u.uuid in ^uuids and
      ut.team_id == ^team.id, group_by: u.id)
  end

  def find_user_by_email(email) do
    Repo.get_by(User, email: String.downcase(email))
  end



  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    Repo.all(User)
  end

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

     iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user!(id), do: Repo.get!(User, id)

  # get user or nil
  def get_user(id), do: Repo.get(User, id)

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  @spec update_user(User.t(), map()) :: {:ok, User.t()} | {:error, any}
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @spec update_user_meta(User.t(), map()) :: {:ok, User.t()} | {:error, any}
  def update_user_meta(user, meta) do
    update_user(user, %{ meta: Utils.updated_meta_field(user.meta, meta) })
  end

  @doc """
  Deletes a User.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user(user)
      %Ecto.Changeset{source: %User{}}

  """
  def change_user(%User{} = user) do
    User.changeset(user, %{})
  end

  ### user data

  @doc """
  Returns the list of user_data.

  ## Examples

      iex> list_user_data()
      [%UserData{}, ...]

  """
  def list_user_data do
    Repo.all(UserData)
  end

  @doc """
  Gets a single user_data.

  Raises `Ecto.NoResultsError` if the User data does not exist.

  ## Examples

      iex> get_user_data!(123)
      %UserData{}

      iex> get_user_data!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user_data!(id), do: Repo.get!(UserData, id)

  @doc """
  Creates a user_data.

  ## Examples

      iex> create_user_data(%{field: value})
      {:ok, %UserData{}}

      iex> create_user_data(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user_data(attrs \\ %{}) do
    %UserData{}
    |> UserData.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user_data.

  ## Examples

      iex> update_user_data(user_data, %{field: new_value})
      {:ok, %UserData{}}

      iex> update_user_data(user_data, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user_data(%UserData{} = user_data, attrs) do
    user_data
    |> UserData.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a UserData.

  ## Examples

      iex> delete_user_data(user_data)
      {:ok, %UserData{}}

      iex> delete_user_data(user_data)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user_data(%UserData{} = user_data) do
    Repo.delete(user_data)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user_data changes.

  ## Examples

      iex> change_user_data(user_data)
      %Ecto.Changeset{source: %UserData{}}

  """
  def change_user_data(%UserData{} = user_data) do
    UserData.changeset(user_data, %{})
  end

  alias Sequence.Users.MagicLink

  @doc """
  Returns the list of magic_links.

  ## Examples

      iex> list_magic_links()
      [%MagicLink{}, ...]

  """
  def list_magic_links do
    Repo.all(MagicLink)
  end

  @doc """
  Gets a single magic_link.

  Raises `Ecto.NoResultsError` if the Magic link does not exist.

  ## Examples

      iex> get_magic_link!(123)
      %MagicLink{}

      iex> get_magic_link!(456)
      ** (Ecto.NoResultsError)

  """
  def get_magic_link!(id), do: Repo.get!(MagicLink, id)

  def find_magic_link_by_user_id(user_id) do
    Repo.get_by(MagicLink, user_id: user_id)
  end

  def find_magic_link_by_email(email) do
    Repo.one(from ml in MagicLink, where: ml.email == ^email, order_by: [desc: :id], limit: 1)
  end

  @doc """
  Creates a magic_link.

  ## Examples

      iex> create_magic_link(%{field: value})
      {:ok, %MagicLink{}}

      iex> create_magic_link(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_magic_link(attrs \\ %{}) do
    %MagicLink{}
    |> MagicLink.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a magic_link.

  ## Examples

      iex> update_magic_link(magic_link, %{field: new_value})
      {:ok, %MagicLink{}}

      iex> update_magic_link(magic_link, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_magic_link(%MagicLink{} = magic_link, attrs) do
    magic_link
    |> MagicLink.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a MagicLink.

  ## Examples

      iex> delete_magic_link(magic_link)
      {:ok, %MagicLink{}}

      iex> delete_magic_link(magic_link)
      {:error, %Ecto.Changeset{}}

  """
  def delete_magic_link(%MagicLink{} = magic_link) do
    Repo.delete(magic_link)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking magic_link changes.

  ## Examples

      iex> change_magic_link(magic_link)
      %Ecto.Changeset{source: %MagicLink{}}

  """
  def change_magic_link(%MagicLink{} = magic_link) do
    MagicLink.changeset(magic_link, %{})
  end

end
