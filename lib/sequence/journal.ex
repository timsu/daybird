defmodule Sequence.Journal do
  @moduledoc """
  The Journal context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.Journal.DailyNote

  def get_daily_notes(project_id, type, start_date, end_date) do
    Repo.all(from n in DailyNote, where: n.project_id == ^project_id and
      n.type == ^type and
      n.date >= ^start_date and
      n.date <= ^end_date, limit: 31)
  end

  def get_daily_note(project_id, type, date) do
    Repo.one(from n in DailyNote, where: n.project_id == ^project_id and
      n.type == ^type and n.date == ^date)
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


  alias Sequence.Journal.Streak

  @doc """
  Returns the list of streaks.

  ## Examples

      iex> list_streaks()
      [%Streak{}, ...]

  """
  def list_streaks do
    Repo.all(Streak)
  end

  @doc """
  Gets a single streak.

  Raises `Ecto.NoResultsError` if the Streak does not exist.

  ## Examples

      iex> get_streak!(123)
      %Streak{}

      iex> get_streak!(456)
      ** (Ecto.NoResultsError)

  """
  def get_streak!(id), do: Repo.get!(Streak, id)

  @doc """
  Creates a streak.

  ## Examples

      iex> create_streak(%{field: value})
      {:ok, %Streak{}}

      iex> create_streak(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_streak(attrs \\ %{}) do
    %Streak{}
    |> Streak.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a streak.

  ## Examples

      iex> update_streak(streak, %{field: new_value})
      {:ok, %Streak{}}

      iex> update_streak(streak, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_streak(%Streak{} = streak, attrs) do
    streak
    |> Streak.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a streak.

  ## Examples

      iex> delete_streak(streak)
      {:ok, %Streak{}}

      iex> delete_streak(streak)
      {:error, %Ecto.Changeset{}}

  """
  def delete_streak(%Streak{} = streak) do
    Repo.delete(streak)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking streak changes.

  ## Examples

      iex> change_streak(streak)
      %Ecto.Changeset{data: %Streak{}}

  """
  def change_streak(%Streak{} = streak, attrs \\ %{}) do
    Streak.changeset(streak, attrs)
  end
end
