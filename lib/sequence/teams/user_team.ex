defmodule Sequence.Teams.UserTeam do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Teams.Team, Users.User}

  @valid_roles ["admin", "member", "guest", "device"]

  def valid_roles(), do: @valid_roles
  def role_admin(), do: @valid_roles |> Enum.fetch!(0)
  def role_member(), do: @valid_roles |> Enum.fetch!(1)
  def role_guest(), do: @valid_roles |> Enum.fetch!(2)
  def role_device(), do: @valid_roles |> Enum.fetch!(3)

  def status_left(), do: "left" # user left by themselves
  def status_deactivated(), do: "deactivated" # team admin deactivated the member
  def status_purged(), do: "purged" # Tandem admin removed user

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "user_teams" do
    belongs_to :user, User
    belongs_to :team, Team
    field :role, :string
    field :status, :string
    field :presence, :integer
    field :last_doc, Ecto.UUID
    field :left_at, :utc_datetime, usec: false
    field :meta, :map
    field :invite_id, :id

    timestamps()
  end

  @doc false
  def changeset(user_team, attrs) do
    user_team
    |> cast(attrs, [:role, :status, :user_id, :team_id, :last_doc, :left_at, :meta, :presence, :invite_id])
    |> validate_required([:role, :user_id, :team_id])
    |> validate_inclusion(:role, @valid_roles)
  end

  def active?(user_team) do
    user_team.left_at == nil
  end

end
