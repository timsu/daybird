defmodule Sequence.Orgs do
  @moduledoc """
  The Orgs context.
  """

  import Ecto.Query, warn: false
  alias Sequence.Repo

  alias Sequence.{Orgs.Organization, Users.User, Utils}

  # restrict all users of a team to be part of organization
  def restriction_all, do: 1

  def org_for_domain(domain) do
    if Utils.free_email_domain?(domain) do
      nil
    else
      domain_like = "%,#{domain},%"
      Repo.one(from o in Organization, where: o.domain == ^domain or like(o.domains, ^domain_like))
    end
  end

  def org_for_email(email) do
    EmailChecker.Tools.domain_name(email)
    |> org_for_domain
  end

  def find_or_create_org(domain, name) do
    if org = org_for_domain(domain) do
      {:ok, org}
    else
      create_organization(%{ domain: domain, name: name })
    end
  end

  def find_users(org) do
    Repo.all(from u in User, where: u.org_id == ^org.id)
  end

  def find_missing_users(%Organization{domain: nil}), do: []
  def find_missing_users(%Organization{domain: domain}) do
    domain_like = "%@#{domain}"
    Repo.all(from u in User, where: like(u.email, ^domain_like) and is_nil(u.org_id))
  end

  def add_to_org(users, org) do
    ids = Enum.map(users, &(&1.id))
    from(u in User, where: u.id in ^ids)
    |> Repo.update_all(set: [org_id: org.id])
  end

  @spec by_uuid(binary) :: {:error, :not_found} | {:ok, Organization.t()}
  def by_uuid(uuid) do
    org = Repo.one(from q in Organization, where: q.uuid == ^uuid)
    if org, do: {:ok, org}, else: {:error, :not_found}
  end

  @doc """
  Returns the list of organizations.

  ## Examples

      iex> list_organizations()
      [%Organization{}, ...]

  """
  def list_organizations do
    Repo.all(Organization)
  end

  @doc """
  Gets a single organization.

  Raises `Ecto.NoResultsError` if the Organization does not exist.

  ## Examples

      iex> get_organization!(123)
      %Organization{}

      iex> get_organization!(456)
      ** (Ecto.NoResultsError)

  """
  def get_organization(id), do: Repo.get(Organization, id)
  def get_organization!(id), do: Repo.get!(Organization, id)

  @doc """
  Creates a organization.

  ## Examples

      iex> create_organization(%{field: value})
      {:ok, %Organization{}}

      iex> create_organization(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_organization(attrs \\ %{}) do
    result = %Organization{}
    |> Organization.changeset(attrs)
    |> Repo.insert()

    with {:ok, org} <- result do
      find_missing_users(org)
      |> add_to_org(org)
      result
    end
  end

  @doc """
  Updates a organization.

  ## Examples

      iex> update_organization(organization, %{field: new_value})
      {:ok, %Organization{}}

      iex> update_organization(organization, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_organization(%Organization{} = organization, attrs) do
    result = organization
    |> Organization.changeset(attrs)
    |> Repo.update()

    with {:ok, org} <- result do
      find_missing_users(org)
      |> add_to_org(org)
      result
    end
  end

  @doc """
  Deletes a Organization.

  ## Examples

      iex> delete_organization(organization)
      {:ok, %Organization{}}

      iex> delete_organization(organization)
      {:error, %Ecto.Changeset{}}

  """
  def delete_organization(%Organization{} = organization) do
    Repo.delete(organization)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking organization changes.

  ## Examples

      iex> change_organization(organization)
      %Ecto.Changeset{source: %Organization{}}

  """
  def change_organization(%Organization{} = organization) do
    Organization.changeset(organization, %{})
  end
end
