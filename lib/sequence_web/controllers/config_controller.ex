defmodule SequenceWeb.ConfigController do
  use SequenceWeb, :controller
  alias Sequence.{Auth.OAuth, Config, Users, Users.User, Utils, Machines}

  action_fallback SequenceWeb.FallbackController

  def turn_servers(conn, _params) do
    data = Config.get("turnconfig")
    text conn, data
  end

  def jitsi_servers(conn, _params) do
    data = Config.get("jitsi")
    text conn, data
  end

  def downloads(conn, _params) do
    data = [:mac, :windows, :windows_msi, :windows_32, :linux, :linux_deb, :linux_rpm]
    |> Enum.map(fn p -> {p, Config.get("tandem_#{p}") } end)
    |> Enum.into(%{})
    json conn, data
  end

  def version(conn, _params) do
    json conn, %{ version: Sequence.version }
  end

  def app_version(conn, _params) do
    json conn, %{ version: Config.get_latest_version }
  end

  def product_updates(conn, _params) do
    json conn, %{ posts: Config.product_updates }
  end

  def ion_config(conn, _params) do
    config = case Config.get_json(:ion_config) do
      nil -> %{
        sfu_hosts: Application.get_env(:sequence, :sfu_hosts)
      }
      config -> config
    end
    json conn, config
  end

  def time(conn, _params) do
    json conn, %{ time: :os.system_time(:millisecond) }
  end

  def reload(conn, _params) do
    try do
      Config.reload
      Config.read_download_links
      Config.get_latest_version(true)
      json conn, %{ success: true }
    rescue
      e ->
        put_status(conn, 400)
        |> json(%{ error: e })
    end
  end

  def reload_team(conn, %{ "team" => team }) do
    if Sequence.dev? or team == "531b4ac3-ee41-4b6f-a211-a90ce56756de" or
        team == "73b01c4f-6ebf-437b-994f-0377e3101c7a" do
      Utils.user_map(team)
      |> Enum.each(fn {user_id, _} ->
        SequenceWeb.Endpoint.broadcast! "user:#{user_id}", "refresh", %{}
      end)
      json conn, %{ success: true }
    else
      {:error, :not_found}
    end
  end

  def clear_flags(conn, %{ "flags" => flags }) do
    with user <- Guardian.Plug.current_resource(conn) do
      case flags do
      "doc_emails" ->
          meta = Map.put(user.meta || %{}, User.meta_last_dee, nil)
          |> Map.put(User.meta_num_dee, nil)
          Users.update_user(user, %{ meta: meta })
      "first_call" ->
          meta = Map.put(user.meta || %{}, User.meta_first_call, nil)
          Users.update_user(user, %{ meta: meta })
      end
      json conn, %{ success: true }
    end
  end

  def oauth_profile(conn, %{ "provider" => provider, "token" => token }) do
    case provider do
      "google" ->
        with {:ok, profile} <- OAuth.get_user_info("google", token) do
          json conn, profile
        else
          {:error, message} -> {:error, :bad_request, "Unable to access Google Profile: #{message}"}
        end
      _ -> {:error, :bad_request, "Invalid provider"}
    end
  end

  # put "/machine", ConfigController, :update_machine
  def update_machine(conn, %{ "machine" => machine }) do
    with user <- Guardian.Plug.current_resource(conn) do
      attrs = [:battery, :cpu, :graphics, :mem, :os, :serial, :system, :network]
      |> Enum.reduce(%{}, fn field, acc ->
        Map.put(acc, field, Map.get(machine, to_string(field)))
      end)
      {:ok, machine} = Machines.set_machine_for_user(user, attrs)
      json conn, %{ machine_id: machine.uuid }
    end
  end


  def sounds(conn, %{ "team_id" => team_id }) do
    sounds = Config.get_json("sounds:#{team_id}")

    if !sounds do
      json conn, %{ sounds: [] }
    else
      sounds = Enum.map(sounds, fn sound ->
        url = if sound["filename"] do
          scope = {sound["creator"], sound["timestamp"]}
          Sequence.Chat.Attachment.url({sound["filename"], scope}, signed: true, expires_in: 24 * 60 * 60 )
        else
          sound["url"]
        end
        Map.put(sound, "url", url)
      end)

      json conn, %{ sounds: sounds }
    end
  end

  def set_sounds(conn, %{ "team_id" => team_id, "sounds" => sounds }) do
    sounds = Enum.take(sounds, 40)
    |> Enum.map(fn sound ->
      if Map.has_key?(sound, "filename") and Map.has_key?(sound, "url") do
        Map.delete(sound, "url")
      else
        sound
      end
    end)
    Config.set_json("sounds:#{team_id}", sounds)
    json conn, %{ success: true }
  end

end
