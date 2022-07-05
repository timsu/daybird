defmodule Sequence.Orgs.Organization do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "organizations" do
    field :uuid, Ecto.UUID
    field :name, :string
    field :domain, :string
    field :domains, :string
    field :profile_img, :string
    field :deleted_at, :utc_datetime
    field :meta, :map

    timestamps()
  end

  @doc false
  def changeset(organization, attrs) do
    organization
    |> cast(attrs, [:uuid, :name, :domain, :domains, :profile_img, :deleted_at, :meta])
    |> Sequence.Repo.generate_uuid
    |> validate_required([:uuid, :name])
  end
end
