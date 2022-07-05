defmodule Sequence.Orgs.Utils do

  import Ecto.Query

  alias Sequence.{Repo, Teams, Orgs}

  def migrate_teams_with_domains() do

    Repo.all(from t in Teams.Team, where: not is_nil(t.domain) and is_nil(t.org_id))
    |> Enum.each(fn team ->
      domain = team.domain
      org = case Orgs.org_for_domain(domain) do
        nil ->
          case Orgs.create_organization(%{ name: team.name, domain: domain }) do
            {:ok, org} -> org
            other ->
              IO.inspect(other)
              nil
          end
        org -> org
      end

      if org, do: Teams.update_team(team, %{ org_id: org.id })
    end)
  end

end
