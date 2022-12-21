defmodule Sequence.Users.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias Sequence.{Users.MagicLink, Repo, Orgs.Organization}

  @type t :: %__MODULE__{}

  def meta_last_team(), do: "lt"
  def meta_has_app(), do: "ha"
  def meta_last_doc(), do: "ld"
  def meta_last_dee(), do: "ldee"  # dee = doc-edit email
  def meta_num_dee(), do: "ndee"
  def meta_first_call(), do: "fc"
  def meta_last_download_reminder_email(), do: "ldre"
  def meta_slack_user_scopes(), do: "sus"
  def meta_pmf_survey_status(), do: "pmf"
  def meta_hear_before_accept(), do: "hba"
  def meta_mobile_push_token(), do: "mpt"
  def meta_kiosk(), do: "ki"

  def meta_last_download_reminder_email(val), do: %{ "ldre" => val }

  def meta(user, key) do
    user.meta && user.meta[key]
  end

  def nickname_or_name(user) do
    if !is_nil(user.nickname) and user.nickname != "", do: user.nickname, else: user.name
  end

  @timestamps_opts [type: :utc_datetime, usec: false]
  schema "users" do
    field :uuid, Ecto.UUID
    field :name, :string
    field :nickname, :string
    field :email, :string
    field :google_id, :string
    field :apple_id, :string
    field :profile_img, :string
    field :password, :string, virtual: true
    field :password_hash, :string
    field :timezone, :string
    field :invite_id, :integer
    field :meta, :map
    field :activated_at, :utc_datetime
    field :origin_type, :string

    has_one :magic_link, MagicLink
    belongs_to :org, Organization

    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    attrs = Sequence.Utils.atoms_to_keys(attrs)

    attrs = if Map.has_key?(attrs, "google_id") do
      %{ attrs | "google_id" => to_string(attrs["google_id"]) }
    else
      attrs
    end

    user
    |> cast(attrs, [:uuid, :name, :nickname, :profile_img,
      :email, :google_id, :password, :timezone, :activated_at,
      :invite_id, :meta, :org_id, :origin_type, :apple_id])
    |> cast_assoc(:magic_link)
    |> Repo.generate_uuid
    |> validate_required([:uuid, :name, :email])
    |> validate_length(:email, min: 1, max: 150)
    |> validate_length(:password, min: 5, max: 50)
    |> validate_length(:profile_img, min: 5, max: 255)
    |> Repo.truncate(:timezone, 30)
    |> Repo.truncate(:nickname, 50)
    |> Repo.truncate(:name, 100)
    |> Repo.validate_invalid_chars(:name, "║")
    |> Repo.validate_invalid_chars(:nickname, "║")
    |> Repo.downcase(:email)
    |> unique_constraint(:email)
    |> put_password_hash()
  end

  defp put_password_hash(changeset) do
    case changeset do
      %Ecto.Changeset{valid?: true, changes: %{password: pass}} ->
        put_change(changeset, :password_hash, Bcrypt.hash_pwd_salt(pass))
        |> delete_change(:password)
      _ ->
        changeset
    end
  end

  def verified, do: "verified"
end
