defmodule Sequence.Teams.Team do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Orgs.Organization, Repo, Users.User}

  def meta_locked(), do: "locked"
  def meta_disallow_external(), do: "noext"
  def meta_default_hear_before_accept(), do: "hba"

  def meta(team, key) do
    team.meta && team.meta[key]
  end

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "teams" do
    field :uuid, Ecto.UUID
    field :name, :string, size: 100
    field :domain, :string, size: 50
    field :status, :string, size: 20
    field :deleted_at, :utc_datetime, usec: false
    field :meta, :map
    field :referrer, :string, size: 100
    field :async, :string, size: 20
    field :size, :integer
    field :activated_at, :utc_datetime, usec: false
    field :critical_mass_at, :utc_datetime, usec: false
    field :origin_type, :string, size: 10

    # when teams hit 100 calling hours
    field :large_activated_at, :utc_datetime, usec: false

    # billing type (monthly, annual)
    field :billing_plan, :string, size: 20
    # billing start date (for active billing teams)
    field :billing_starts_at, :utc_datetime, usec: false

    belongs_to :org, Organization
    belongs_to :creator, User

    timestamps()
  end

  @doc false
  def changeset(team, attrs) do
    team
    |> cast(attrs, [:uuid, :name, :domain, :status, :meta, :deleted_at, :referrer, :async, :size,
      :activated_at, :large_activated_at, :org_id, :origin_type, :billing_plan, :billing_starts_at,
      :creator_id, :critical_mass_at])
    |> Repo.generate_uuid
    |> validate_required([:uuid, :name])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:domain, min: 1, max: 50)
    |> validate_length(:async, min: 1, max: 20)
    |> Repo.truncate(:referrer, 90)
  end
end
