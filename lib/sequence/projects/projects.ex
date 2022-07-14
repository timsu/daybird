defmodule Sequence.Projects do
  @moduledoc """
  The Projects context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.Projects.Project

  @doc """
  Returns the list of projects.

  ## Examples

      iex> list_projects()
      [%Project{}, ...]

  """
  def list_projects do
    Repo.all(Project)
  end

  @doc """
  Gets a single project.

  Raises `Ecto.NoResultsError` if the Project does not exist.

  ## Examples

      iex> get_project!(123)
      %Project{}

      iex> get_project!(456)
      ** (Ecto.NoResultsError)

  """
  def get_project!(id), do: Repo.get!(Project, id)

  @doc """
  Creates a project.

  ## Examples

      iex> create_project(%{field: value})
      {:ok, %Project{}}

      iex> create_project(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_project(attrs \\ %{}) do
    %Project{}
    |> Project.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a project.

  ## Examples

      iex> update_project(project, %{field: new_value})
      {:ok, %Project{}}

      iex> update_project(project, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_project(%Project{} = project, attrs) do
    project
    |> Project.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a project.

  ## Examples

      iex> delete_project(project)
      {:ok, %Project{}}

      iex> delete_project(project)
      {:error, %Ecto.Changeset{}}

  """
  def delete_project(%Project{} = project) do
    Repo.delete(project)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking project changes.

  ## Examples

      iex> change_project(project)
      %Ecto.Changeset{data: %Project{}}

  """
  def change_project(%Project{} = project, attrs \\ %{}) do
    Project.changeset(project, attrs)
  end

  alias Sequence.Projects.UserProject

  @doc """
  Returns the list of user_projects.

  ## Examples

      iex> list_user_projects()
      [%UserProject{}, ...]

  """
  def list_user_projects do
    Repo.all(UserProject)
  end

  @doc """
  Gets a single user_project.

  Raises `Ecto.NoResultsError` if the User project does not exist.

  ## Examples

      iex> get_user_project!(123)
      %UserProject{}

      iex> get_user_project!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user_project!(id), do: Repo.get!(UserProject, id)

  @doc """
  Creates a user_project.

  ## Examples

      iex> create_user_project(%{field: value})
      {:ok, %UserProject{}}

      iex> create_user_project(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user_project(attrs \\ %{}) do
    %UserProject{}
    |> UserProject.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user_project.

  ## Examples

      iex> update_user_project(user_project, %{field: new_value})
      {:ok, %UserProject{}}

      iex> update_user_project(user_project, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user_project(%UserProject{} = user_project, attrs) do
    user_project
    |> UserProject.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a user_project.

  ## Examples

      iex> delete_user_project(user_project)
      {:ok, %UserProject{}}

      iex> delete_user_project(user_project)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user_project(%UserProject{} = user_project) do
    Repo.delete(user_project)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user_project changes.

  ## Examples

      iex> change_user_project(user_project)
      %Ecto.Changeset{data: %UserProject{}}

  """
  def change_user_project(%UserProject{} = user_project, attrs \\ %{}) do
    UserProject.changeset(user_project, attrs)
  end
end
