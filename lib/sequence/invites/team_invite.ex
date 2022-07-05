defmodule Sequence.Invites.TeamInvite do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Teams.Team, Users.User, Repo, Teams.UserTeam}

  @type t :: %__MODULE__{}

  def status_accepted, do: "accepted"

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "team_invites" do
    belongs_to :user, User
    belongs_to :team, Team
    field :code, :string
    field :type, :string
    field :role, :string
    field :status, :string
    field :slack_team_id, :string, size: 50
    field :expires_at, :utc_datetime, usec: false
    field :count, :integer
    field :recipient, :string, size: 50
    field :joined, :boolean

    timestamps()
  end

  @doc false
  def changeset(team_invite, attrs) do
    team_invite
    |> cast(attrs, [:code, :role, :type, :status, :user_id, :team_id, :expires_at, :slack_team_id,
      :count, :recipient, :joined])
    |> validate_required([:code, :role])
    |> validate_inclusion(:role, UserTeam.valid_roles())
    |> Repo.truncate_date(:expires_at)
  end
end
