defmodule Sequence.Auth do

  alias Sequence.{Auth.Guardian, Invites.TeamInvite}

  def gen_token(user, sso \\ false) do
    {:ok, token, _claims} = Guardian.refresh_token(user, sso)
    token
  end

  def gen_meeting_guest_token(user) do
    {:ok, token, _claims} = Guardian.partial_token(user, ["meeting_guest"])
    token
  end

  @spec gen_guest_token(TeamInvite.t()) :: binary
  def gen_guest_token(invite) do
    {:ok, token, _claims} = Guardian.guest_token(invite)
    token
  end

end
