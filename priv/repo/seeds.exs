# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Sequence.Repo.insert!(%Sequence.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

user = Sequence.Repo.insert!(%Sequence.Users.User{
  name: "Bob Cat",
  email: "bob@cat.com"
})

_project = Sequence.Repo.insert!(%Sequence.Projects.Project{
  creator_id: user.id,
  name: "Work Stuff",
  shortcode: "WS"
})
