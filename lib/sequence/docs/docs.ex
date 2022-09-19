defmodule Sequence.Docs do
  @moduledoc """
  The Docs context.
  """

  import Ecto.Query, warn: false
  alias Sequence.{Projects.Project, Repo}

  alias Sequence.Docs.Doc

  @spec list_docs(Project.t()) :: [Doc.t()]
  def list_docs(project) do
    Repo.all(from d in Doc, where: d.project_id == ^project.id
      and is_nil(d.deleted_at) and is_nil(d.archived_at))
  end

  @spec doc_by_uuid(Project.t(), binary) :: {:error, :not_found} | {:ok, Doc.t()}
  def doc_by_uuid(project, uuid) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      doc = Repo.one(from q in Doc, where: q.project_id == ^project.id and q.uuid == ^Base.decode16!(String.upcase(uuid)))
      if doc, do: {:ok, doc}, else: {:error, :not_found}
    else
      {:error, :not_found}
    end
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
