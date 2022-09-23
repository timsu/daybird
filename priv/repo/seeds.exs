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

project = Sequence.Repo.insert!(%Sequence.Projects.Project{
  creator_id: user.id,
  uuid: Ecto.UUID.generate,
  name: "Work Stuff",
  shortcode: "WS"
})

Sequence.Repo.insert!(%Sequence.Projects.UserProject{
  user_id: user.id,
  project_id: project.id,
  role: "admin"
})
