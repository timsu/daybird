defmodule Sequence.Tasks do
  @moduledoc """
  The Tasks context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.Tasks.Task

  @spec list_tasks(User.t()) :: [Task.t()]
  def list_tasks(project) do
    from(t in Task, where: t.project_id == ^project.id and is_nil(t.deleted_at) and is_nil(t.archived_at)
      and is_nil(t.completed_at), order_by: [asc: :id])
    |> Repo.all
  end

  @spec task_by_uuid(binary) :: {:error, :not_found} | {:ok, Task.t()}
  def task_by_uuid(uuid) do
    if uuid != nil and uuid != "undefined" and uuid != "" do
      task = Repo.one(from q in Task, where: q.uuid == ^Base.decode16!(String.upcase(uuid)))
      if task, do: {:ok, task}, else: {:error, :not_found}
    else
      {:error, :not_found}
    end
  end

  @spec task_by_short_code(binary) :: {:error, :not_found} | {:ok, Task.t()}
  def task_by_short_code(code) do
    if code != nil and code != "undefined" and code != "" do
      task = Repo.one(from q in Task, where: q.short_code == ^code)
      if task, do: {:ok, task}, else: {:error, :not_found}
    else
      {:error, :not_found}
    end
  end

  @doc """
  Returns the list of tasks.

  ## Examples

      iex> list_tasks()
      [%Task{}, ...]

  """
  def list_tasks do
    Repo.all(Task)
  end

  @doc """
  Gets a single task.

  Raises `Ecto.NoResultsError` if the Task does not exist.

  ## Examples

      iex> get_task!(123)
      %Task{}

      iex> get_task!(456)
      ** (Ecto.NoResultsError)

  """
  def get_task!(id), do: Repo.get!(Task, id)

  @doc """
  Creates a task.

  ## Examples

      iex> create_task(%{field: value})
      {:ok, %Task{}}

      iex> create_task(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_task(attrs \\ %{}) do
    %Task{}
    |> Task.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a task.

  ## Examples

      iex> update_task(task, %{field: new_value})
      {:ok, %Task{}}

      iex> update_task(task, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_task(%Task{} = task, attrs) do
    task
    |> Task.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a task.

  ## Examples

      iex> delete_task(task)
      {:ok, %Task{}}

      iex> delete_task(task)
      {:error, %Ecto.Changeset{}}

  """
  def delete_task(%Task{} = task) do
    Repo.delete(task)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking task changes.

  ## Examples

      iex> change_task(task)
      %Ecto.Changeset{data: %Task{}}

  """
  def change_task(%Task{} = task, attrs \\ %{}) do
    Task.changeset(task, attrs)
  end
end
