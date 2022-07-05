defmodule SequenceWeb.EnsureAdmin do
  import Plug.Conn

  alias Sequence.Teams

  @behaviour Plug

  def init(opts), do: opts

  @spec validate_admin(Sequence.Users.User.t()) :: :ok | {:error, :unauthorized}
  def validate_admin(user) do
    if Sequence.test? do
      teams = Teams.list_user_teams(user)
      if length(teams) > 0 && Teams.is_admin?(teams |> Enum.at(0), user), do: :ok, else: {:error, :unauthorized}
    else
      tandem = Teams.get_team!(1)
      if Teams.is_admin?(tandem, user), do: :ok, else: {:error, :unauthorized}
    end
  end

  @spec validate_analytics(Sequence.Users.User.t()) :: :ok | {:error, :unauthorized}
  def validate_analytics(user) do
    if Sequence.test? do
      teams = Teams.list_user_teams(user)
      if length(teams) > 0 && Teams.is_member?(teams |> Enum.at(0), user), do: :ok, else: {:error, :unauthorized}
    else
      tandem = Teams.get_team!(1)
      if Teams.is_member?(tandem, user), do: :ok, else: {:error, :unauthorized}
    end
  end

  def call(conn, _opts) do
    with user when is_map(user) <- Guardian.Plug.current_resource(conn) do
      result = validate_admin(user)
      if Sequence.dev? or result == :ok do
        assign(conn, :user, user)
      else
        conn |> SequenceWeb.FallbackController.call(result) |> halt()
      end
    else
      nil -> {:error, :unauthorized}
    end
  end
end
