defmodule Sequence.Docs do

  @doc_root Application.get_env(:sequence, :docroot, "docs")

  @extension ".seq"

  def list_docs(project) do
    path = project_path(project)
    case File.ls(path) do
      {:ok, list} -> {:ok, list}
      {:error, :enoent} -> {:ok, []}
      error -> error
    end
  end

  def list_docs_recursive(project, depth \\ nil) do
    path = project_path(project)
    docroot_length = String.length(path) + 1
    case Xfile.ls(path, recursive: depth || true) do
      {:ok, stream} ->
        list = stream
        |> Enum.map(fn item ->
          String.slice(item, docroot_length, 999)
        end)
        {:ok, list}
      {:error, :enoent} -> {:ok, []}
      error -> error
    end
  end

  def new_doc(project, name) do
    path = project_path(project)
    name = if String.ends_with?(name, @extension) do
      name
    else
      name <> @extension
    end
    filepath = Path.join(path, name)

    with :ok <- mkdir_if_needed(path),
         :ok <- file_not_exists(filepath) do
      File.write(filepath, "")
    end
  end

  def new_folder(project, name) do
    path = project_path(project)
    folderpath = Path.join(path, name)

    with :ok <- mkdir_if_needed(path),
         :ok <- file_not_exists(folderpath) do
      File.mkdir(folderpath)
    end
  end

  def read_doc(project, name) do
    filepath = file_path(project, name)
    File.read(filepath)
  end

  def write_doc(project, name, contents) do
    filepath = file_path(project, name)
    path = Path.dirname(filepath)

    with :ok <- mkdir_if_needed(path) do
      File.write(filepath, contents)
    end
  end

  ### helpers

  def file_not_exists(path) do
    case File.exists?(path) do
      true -> {:error, :already_exists}
      false -> :ok
    end
  end

  def mkdir_if_needed(path) do
    case File.dir?(path) do
      true -> :ok
      false -> File.mkdir_p(path)
    end
  end

  def project_path(project) do
    Path.join(@doc_root, to_string(project.id))
  end

  def file_path(project, filename) do
    project_path(project)
    |> Path.join(filename)
  end

end
