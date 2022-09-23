defmodule SequenceWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use SequenceWeb.ConnCase, async: true`, although
  this option is not recommended for other databases.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import SequenceWeb.ConnCase

      alias SequenceWeb.Router.Helpers, as: Routes

      # The default endpoint for testing
      @endpoint SequenceWeb.Endpoint

      alias Sequence.{Auth, Projects, Users, Utils}

      def auth(conn, user) do
        {:ok, token, _claims} = Auth.Guardian.full_token(user)
        put_req_header(conn, "authorization", "Bearer #{token}")
      end

      def auth_guest(conn, invite) do
        token = Auth.gen_guest_token(invite)
        put_req_header(conn, "authorization", "Bearer #{token}")
      end

      def user_project do
        user = Users.get_user! 1
        project = Projects.get_project! 1
        project_uuid = Utils.no_dash(project.uuid)
        {user, project, project_uuid}
      end

    end
  end

  setup tags do
    Sequence.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
