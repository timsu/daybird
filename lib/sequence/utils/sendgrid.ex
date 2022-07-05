defmodule Sequence.Sendgrid do
  alias Sequence.{Repo, Users, Intercom}

  import Ecto.Query, warn: false

  use Sequence.ApiAccessor, name: :sendgrid

  @url_base "https://api.sendgrid.com/v3/"

  @batch_size 5000 # work in batches

  @unsubscribe_group_marketing 29258

  @contact_list_newsletter "b81c12e2-f220-4625-b061-5fcfd8510486"

  def run_export() do
    unsubs = import_unsubscribes()
    |> MapSet.new

    export_all_users(unsubs)

    :ok
  end

  ### export to sendgrid

  def export_all_users(unsubs) do
    list_id = all_users_list()

    export_users_at(list_id, unsubs, 0)
  end

  def export_users_at(list_id, unsubs, starting_id) do
    users = Repo.all(from u in Users.User, select: [:id, :name, :nickname, :email, :meta],
      where: u.id > ^starting_id, order_by: [asc: :id], limit: @batch_size)

    contacts = Enum.filter(users, fn user ->
      String.contains?(user.email, "@") and
      !String.contains?(user.email, "@demo.com") and
      !String.contains?(user.email, "@wisp.chat") and
      !String.contains?(user.email, "@tandem.chat") and
      !Map.has_key?(user.meta || %{}, "ki") and
      !MapSet.member?(unsubs, user.email)
    end)
    |> Enum.map(fn user ->
      %{
        :email => user.email,
        :first_name => Repo.truncate_string(user.nickname || user.name, 50)
      }
    end)

    user_count = length(users)
    with {:ok, _} <- add_contacts([list_id], contacts) do
      IO.puts("Uploaded #{length(contacts)} emails to Sendgrid (of #{user_count} users)")
    else
      error -> IO.inspect(error, label: "Error adding contacts")
    end

    if user_count == @batch_size do
      new_id = List.last(users).id
      export_users_at(list_id, unsubs, new_id)
    end
  end

  def all_users_list() do
    if Sequence.dev? or Sequence.test? do
      "c8f22455-372e-4f43-b733-ad94f4fb22f4"
    else
      "1a2c3acf-f900-4c44-8ac2-d3a2ebf84227"
    end
  end

  ### import from intercom

  def import_unsubscribes do
    emails = Intercom.unsubscribed_users
    IO.puts("Loaded #{length emails} unsubscribed emails")

    Enum.chunk_every(emails, 2000)
    |> Enum.each(fn list -> add_unsubscribes(list) end)

    emails
  end

  ### utilities

  def api_config do
    api_key = Application.get_env(:sequence, :sendgrid_api_key)
    {@url_base, api_key}
  end

  def lists do
    get("marketing/lists")
  end

  def add_contacts(list_ids, contacts) do
    put("marketing/contacts", %{
      list_ids: list_ids,
      contacts: contacts
    })
  end

  def add_unsubscribes(emails) do
    post("/asm/groups/#{@unsubscribe_group_marketing}/suppressions", %{
      recipient_emails: emails
    })
  end

  def add_to_newsletter(email) do
    contact = %{
      :email => email,
    }

    put("marketing/contacts", %{
      list_ids: [@contact_list_newsletter],
      contacts: [contact]
    })
  end

end
