defmodule Sequence.Docs do
  @moduledoc """
  The Docs context.
  """

  import Ecto.Query, warn: false
  alias Sequence.{Projects.Project, Repo}

  alias Sequence.Docs.{File, Doc}

  @spec list_files(Project.t()) :: [File.t()]
  def list_files(project) do
    Repo.all(from d in File, where: d.project_id == ^project.id
      and is_nil(d.deleted_at) and is_nil(d.archived_at))
  end

  @spec file_by_uuid(Project.t(), binary) :: {:error, :not_found} | {:ok, File.t()}
  def file_by_uuid(project, uuid) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      file = Repo.one(from q in File, where: q.project_id == ^project.id and q.uuid == ^Sequence.Utils.uuid_to_base16(uuid))
      if file, do: {:ok, file}, else: {:error, :not_found}
    else
      {:error, :not_found}
    end
  end

  @spec doc_by_uuid(Project.t(), binary) :: {:error, :not_found} | {:ok, Doc.t()}
  def doc_by_uuid(project, uuid) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      doc = Repo.one(from q in Doc, where: q.project_id == ^project.id and q.uuid == ^Sequence.Utils.uuid_to_base16(uuid))
      if doc, do: {:ok, doc}, else: {:error, :not_found}
    else
      {:error, :not_found}
    end
  end

  @spec set_doc_contents(Project.t(), binary, binary) :: {:ok, Doc.t()}
  def set_doc_contents(project, uuid, contents) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      doc = Repo.one(from q in Doc, select: [:id], where: q.project_id == ^project.id and q.uuid == ^Sequence.Utils.uuid_to_base16(uuid))
      if doc do
        doc
        |> Ecto.Changeset.cast(%{ contents: contents }, [:contents])
        |> Repo.update()
      else
        create_doc(%{
          uuid: Sequence.Utils.uuid_to_base16(uuid),
          project_id: project.id,
          contents: contents
        })
      end
    else
      {:error, :not_found}
    end
  end

  @spec set_doc_bindata(Project.t(), binary, binary) :: {:ok, Doc.t()}
  def set_doc_bindata(project, uuid, contents) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      doc = Repo.one(from q in Doc, select: [:id], where: q.project_id == ^project.id and q.uuid == ^Sequence.Utils.uuid_to_base16(uuid))
      if doc do
        doc
        |> Ecto.Changeset.cast(%{ bindata: contents }, [:bindata])
        |> Repo.update()
      else
        create_doc(%{
          uuid: Sequence.Utils.uuid_to_base16(uuid),
          project_id: project.id,
          bindata: contents
        })
      end
    else
      {:error, :not_found}
    end
  end

  def move_doc(file, new_project) do
    {:ok, file} = update_file(file, %{ project_id: new_project.id })
    uuid = file.uuid

    from(d in Doc, where: d.uuid == ^uuid, update: [set: [project_id: ^new_project.id]])
    |> Repo.update_all([])
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

  @doc """
  Returns the list of docs.

  ## Examples

      iex> list_docs()
      [%Doc{}, ...]

  """
  def list_docs do
    Repo.all(Doc)
  end

  @doc """
  Gets a single doc.

  Raises `Ecto.NoResultsError` if the Doc does not exist.

  ## Examples

      iex> get_doc!(123)
      %Doc{}

      iex> get_doc!(456)
      ** (Ecto.NoResultsError)

  """
  def get_doc!(id), do: Repo.get!(Doc, id)

  @doc """
  Creates a doc.

  ## Examples

      iex> create_doc(%{field: value})
      {:ok, %Doc{}}

      iex> create_doc(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_doc(attrs \\ %{}) do
    %Doc{}
    |> Doc.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a doc.

  ## Examples

      iex> update_doc(doc, %{field: new_value})
      {:ok, %Doc{}}

      iex> update_doc(doc, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_doc(%Doc{} = doc, attrs) do
    doc
    |> Doc.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a doc.

  ## Examples

      iex> delete_doc(doc)
      {:ok, %Doc{}}

      iex> delete_doc(doc)
      {:error, %Ecto.Changeset{}}

  """
  def delete_doc(%Doc{} = doc) do
    Repo.delete(doc)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking doc changes.

  ## Examples

      iex> change_doc(doc)
      %Ecto.Changeset{data: %Doc{}}

  """
  def change_doc(%Doc{} = doc, attrs \\ %{}) do
    Doc.changeset(doc, attrs)
  end
end
