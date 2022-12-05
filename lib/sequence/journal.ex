defmodule Sequence.Journal do
  @moduledoc """
  The Journal context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.Journal.DailyNote

  def get_daily_notes(project_id, start_date, end_date) do
    Repo.all(from n in DailyNote, where: n.project_id == ^project_id and n.date >= ^start_date and
      n.date <= ^end_date, limit: 31)
  end

  def get_daily_note(project_id, date) do
    Repo.one(from n in DailyNote, where: n.project_id == ^project_id and n.date == ^date)
  end

  @doc """
  Returns the list of daily_notes.

  ## Examples

      iex> list_daily_notes()
      [%DailyNote{}, ...]

  """
  def list_daily_notes do
    Repo.all(DailyNote)
  end

  @doc """
  Gets a single daily_note.

  Raises `Ecto.NoResultsError` if the Daily note does not exist.

  ## Examples

      iex> get_daily_note!(123)
      %DailyNote{}

      iex> get_daily_note!(456)
      ** (Ecto.NoResultsError)

  """
  def get_daily_note!(id), do: Repo.get!(DailyNote, id)

  @doc """
  Creates a daily_note.

  ## Examples

      iex> create_daily_note(%{field: value})
      {:ok, %DailyNote{}}

      iex> create_daily_note(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_daily_note(attrs \\ %{}) do
    %DailyNote{}
    |> DailyNote.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a daily_note.

  ## Examples

      iex> update_daily_note(daily_note, %{field: new_value})
      {:ok, %DailyNote{}}

      iex> update_daily_note(daily_note, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_daily_note(%DailyNote{} = daily_note, attrs) do
    daily_note
    |> DailyNote.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a daily_note.

  ## Examples

      iex> delete_daily_note(daily_note)
      {:ok, %DailyNote{}}

      iex> delete_daily_note(daily_note)
      {:error, %Ecto.Changeset{}}

  """
  def delete_daily_note(%DailyNote{} = daily_note) do
    Repo.delete(daily_note)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking daily_note changes.

  ## Examples

      iex> change_daily_note(daily_note)
      %Ecto.Changeset{data: %DailyNote{}}

  """
  def change_daily_note(%DailyNote{} = daily_note, attrs \\ %{}) do
    DailyNote.changeset(daily_note, attrs)
  end

  alias Sequence.Journal.Summary

  @doc """
  Returns the list of summaries.

  ## Examples

      iex> list_summaries()
      [%Summary{}, ...]

  """
  def list_summaries do
    Repo.all(Summary)
  end

  @doc """
  Gets a single summary.

  Raises `Ecto.NoResultsError` if the Summary does not exist.

  ## Examples

      iex> get_summary!(123)
      %Summary{}

      iex> get_summary!(456)
      ** (Ecto.NoResultsError)

  """
  def get_summary!(id), do: Repo.get!(Summary, id)

  @doc """
  Creates a summary.

  ## Examples

      iex> create_summary(%{field: value})
      {:ok, %Summary{}}

      iex> create_summary(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_summary(attrs \\ %{}) do
    %Summary{}
    |> Summary.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a summary.

  ## Examples

      iex> update_summary(summary, %{field: new_value})
      {:ok, %Summary{}}

      iex> update_summary(summary, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_summary(%Summary{} = summary, attrs) do
    summary
    |> Summary.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a summary.

  ## Examples

      iex> delete_summary(summary)
      {:ok, %Summary{}}

      iex> delete_summary(summary)
      {:error, %Ecto.Changeset{}}

  """
  def delete_summary(%Summary{} = summary) do
    Repo.delete(summary)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking summary changes.

  ## Examples

      iex> change_summary(summary)
      %Ecto.Changeset{data: %Summary{}}

  """
  def change_summary(%Summary{} = summary, attrs \\ %{}) do
    Summary.changeset(summary, attrs)
  end
end
