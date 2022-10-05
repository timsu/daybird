# disable debug & info logging in console
Logger.configure(level: :info)

# global aliases
alias Sequence.{Auth, Invites, Repo, Teams, Users, Utils, Docs, Projects, Attachments}
import Ecto.Query

# color formatting
Application.put_env(:elixir, :ansi_enabled, true)
IEx.configure(
 colors: [
   eval_result: [:green, :bright] ,
   eval_error: [[:red, :bright, "Bug Bug ..!!"]],
   eval_info: [:yellow, :bright ],
 ]
)
