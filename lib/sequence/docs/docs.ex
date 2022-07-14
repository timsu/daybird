defmodule Sequence.Docs do

  @doc_root Application.get_env(:sequence, :docroot, "docs")

  @extension ".delta"

  def list_docs(project) do
    path = project_path(project)
    case File.ls(path) do
      {:ok, list} -> {:ok, list}
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
         :ok <- file_not_exists(filepath) do
      File.mkdir(folderpath)
    end
  end

  def read_doc(project, name) do
    filepath = file_path(project, name)
    File.read(filepath)
  end

  def write_doc(project, name, contents) do
    filepath = file_path(project, name)
    File.write(filepath, data)
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
      false -> File.mkdir(path)
    end
  end

  def project_path(project) do
    Path.join(@doc_root, to_string(project.id))
  end

  def file_path(project, filename) do
    Path.join(@doc_root, to_string(project.id), filename)
  end

end
