defmodule Sequence.Docs do
  @moduledoc """
  The Docs context.
  """

  import Ecto.Query, warn: false
  alias Sequence.{Projects.Project, Repo}

  alias Sequence.Docs.File

  @spec list_files(Project.t()) :: [File.t()]
  def list_files(project) do
    Repo.all(from d in File, where: d.project_id == ^project.id
      and is_nil(d.deleted_at) and is_nil(d.archived_at))
  end

  @spec file_by_uuid(Project.t(), binary) :: {:error, :not_found} | {:ok, File.t()}
  def file_by_uuid(project, uuid) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      file = Repo.one(from q in File, where: q.project_id == ^project.id and q.uuid == ^Base.decode16!(String.upcase(uuid)))
      if file, do: {:ok, file}, else: {:error, :not_found}
    else
      {:error, :not_found}
    end
  end

  @doc """
  Returns the list of files.

  ## Examples

      iex> list_files()
      [%File{}, ...]

  """
  def list_files do
    Repo.all(File)
  end

  @doc """
  Gets a single file.

  Raises `Ecto.NoResultsError` if the File does not exist.

  ## Examples

      iex> get_file!(123)
      %File{}

      iex> get_file!(456)
      ** (Ecto.NoResultsError)

  """
  def get_file!(id), do: Repo.get!(File, id)

  @doc """
  Creates a file.

  ## Examples

      iex> create_file(%{field: value})
      {:ok, %File{}}

      iex> create_file(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_file(attrs \\ %{}) do
    %File{}
    |> File.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a file.

  ## Examples

      iex> update_file(file, %{field: new_value})
      {:ok, %File{}}

      iex> update_file(file, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_file(%File{} = file, attrs) do
    file
    |> File.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a file.

  ## Examples

      iex> delete_file(file)
      {:ok, %File{}}

      iex> delete_file(file)
      {:error, %Ecto.Changeset{}}

  """
  def delete_file(%File{} = file) do
    Repo.delete(file)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking file changes.

  ## Examples

      iex> change_file(file)
      %Ecto.Changeset{data: %File{}}

  """
  def change_file(%File{} = file, attrs \\ %{}) do
    File.changeset(file, attrs)
  end
end
