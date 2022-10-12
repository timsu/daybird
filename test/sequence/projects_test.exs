defmodule Sequence.ProjectsTest do
  use Sequence.DataCase

  alias Sequence.Projects

  describe "projects" do
    alias Sequence.Projects.Project

    import Sequence.ProjectsFixtures

    @invalid_attrs %{archived_at: nil, meta: nil, name: nil}

    test "list_projects/0 returns all projects" do
      project = project_fixture()
      assert Enum.find Projects.list_projects(), fn p -> p.id == project.id end
    end

    test "get_project!/1 returns the project with given id" do
      project = project_fixture()
      assert Projects.get_project!(project.id) == project
    end

    test "create_project/1 with valid data creates a project" do
      valid_attrs = %{archived_at: ~U[2022-07-13 06:12:00Z], meta: %{}, name: "some name",
        shortcode: "PR", creator_id: 1}

      assert {:ok, %Project{} = project} = Projects.create_project(valid_attrs)
      assert project.archived_at == ~U[2022-07-13 06:12:00Z]
      assert project.meta == %{}
      assert project.name == "some name"
    end

    test "create_project/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_project(@invalid_attrs)
    end

    test "update_project/2 with valid data updates the project" do
      project = project_fixture()
      update_attrs = %{archived_at: ~U[2022-07-14 06:12:00Z], meta: %{}, name: "some updated name"}

      assert {:ok, %Project{} = project} = Projects.update_project(project, update_attrs)
      assert project.archived_at == ~U[2022-07-14 06:12:00Z]
      assert project.meta == %{}
      assert project.name == "some updated name"
    end

    test "update_project/2 with invalid data returns error changeset" do
      project = project_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_project(project, @invalid_attrs)
      assert project == Projects.get_project!(project.id)
    end

    test "delete_project/1 deletes the project" do
      project = project_fixture()
      assert {:ok, %Project{}} = Projects.delete_project(project)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_project!(project.id) end
    end

    test "change_project/1 returns a project changeset" do
      project = project_fixture()
      assert %Ecto.Changeset{} = Projects.change_project(project)
    end
  end

  describe "user_projects" do
    alias Sequence.Projects.UserProject

    import Sequence.ProjectsFixtures

    @invalid_attrs %{left_at: nil, role: nil}

    test "list_user_projects/0 returns all user_projects" do
      user_project = user_project_fixture()
      assert Enum.find Projects.list_user_projects(), fn p -> p.id == user_project.id end
    end

    test "get_user_project!/1 returns the user_project with given id" do
      user_project = user_project_fixture()
      assert Projects.get_user_project!(user_project.id) == user_project
    end

    test "create_user_project/1 with valid data creates a user_project" do
      valid_attrs = %{user_id: 1, project_id: 1, role: "some role"}

      assert {:ok, %UserProject{} = user_project} = Projects.create_user_project(valid_attrs)
      assert user_project.user_id == 1
      assert user_project.project_id == 1
      assert user_project.role == "some role"
    end

    test "create_user_project/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_user_project(@invalid_attrs)
    end

    test "update_user_project/2 with valid data updates the user_project" do
      user_project = user_project_fixture()
      update_attrs = %{left_at: ~U[2022-07-14 06:14:00Z], role: "some updated role"}

      assert {:ok, %UserProject{} = user_project} = Projects.update_user_project(user_project, update_attrs)
      assert user_project.left_at == ~U[2022-07-14 06:14:00Z]
      assert user_project.role == "some updated role"
    end

    test "update_user_project/2 with invalid data returns error changeset" do
      user_project = user_project_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_user_project(user_project, @invalid_attrs)
      assert user_project == Projects.get_user_project!(user_project.id)
    end

    test "delete_user_project/1 deletes the user_project" do
      user_project = user_project_fixture()
      assert {:ok, %UserProject{}} = Projects.delete_user_project(user_project)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_user_project!(user_project.id) end
    end

    test "change_user_project/1 returns a user_project changeset" do
      user_project = user_project_fixture()
      assert %Ecto.Changeset{} = Projects.change_user_project(user_project)
    end
  end

  describe "project_invites" do
    alias Sequence.Projects.ProjectInvite

    import Sequence.ProjectsFixtures

    @invalid_attrs %{creator_id: nil, project_id: nil, code: nil, deleted_at: nil, email: nil, joined_at: nil}

    test "list_project_invites/0 returns all project_invites" do
      project_invite = project_invite_fixture()
      assert Projects.list_project_invites() == [project_invite]
    end

    test "get_project_invite!/1 returns the project_invite with given id" do
      project_invite = project_invite_fixture()
      assert Projects.get_project_invite!(project_invite.id) == project_invite
    end

    test "create_project_invite/1 with valid data creates a project_invite" do
      valid_attrs = %{project_id: 1, creator_id: 1, code: "some code", deleted_at: ~U[2022-09-25 01:21:00Z],
        email: "some email", joined_at: ~U[2022-09-25 01:21:00Z], role: "abc"}

      assert {:ok, %ProjectInvite{} = project_invite} = Projects.create_project_invite(valid_attrs)
      assert project_invite.code == "some code"
      assert project_invite.deleted_at == ~U[2022-09-25 01:21:00Z]
      assert project_invite.email == "some email"
      assert project_invite.joined_at == ~U[2022-09-25 01:21:00Z]
    end

    test "create_project_invite/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_project_invite(@invalid_attrs)
    end

    test "update_project_invite/2 with valid data updates the project_invite" do
      project_invite = project_invite_fixture()
      update_attrs = %{code: "some updated code", deleted_at: ~U[2022-09-26 01:21:00Z], email: "some updated email", joined_at: ~U[2022-09-26 01:21:00Z]}

      assert {:ok, %ProjectInvite{} = project_invite} = Projects.update_project_invite(project_invite, update_attrs)
      assert project_invite.code == "some updated code"
      assert project_invite.deleted_at == ~U[2022-09-26 01:21:00Z]
      assert project_invite.email == "some updated email"
      assert project_invite.joined_at == ~U[2022-09-26 01:21:00Z]
    end

    test "update_project_invite/2 with invalid data returns error changeset" do
      project_invite = project_invite_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_project_invite(project_invite, @invalid_attrs)
      assert project_invite == Projects.get_project_invite!(project_invite.id)
    end

    test "delete_project_invite/1 deletes the project_invite" do
      project_invite = project_invite_fixture()
      assert {:ok, %ProjectInvite{}} = Projects.delete_project_invite(project_invite)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_project_invite!(project_invite.id) end
    end

    test "change_project_invite/1 returns a project_invite changeset" do
      project_invite = project_invite_fixture()
      assert %Ecto.Changeset{} = Projects.change_project_invite(project_invite)
    end
  end

  describe "projects methods" do
    import Sequence.ProjectsFixtures
    import Sequence.UsersFixtures

    test "user_joined with no invites" do
      user = user_fixture()
      Projects.user_joined(user)
    end

    test "user_joined with invites" do
      project = project_fixture()

      project_invite_fixture(%{ project_id: project.id, email: "foo@bar.com", role: "admin" })
      user = user_fixture(%{ email: "foo@bar.com" })

      Projects.user_joined(user)

      ups = Projects.list_all_user_project(user)
      assert up = Enum.find(ups, fn up -> up.project_id == project.id end)
      assert up.role == "admin"
    end

    test "user_joined with deleted invite" do
      project = project_fixture()

      project_invite_fixture(%{ project_id: project.id, email: "foo@bar.com",
        role: "admin", deleted_at: Timex.now })
      user = user_fixture(%{ email: "foo@bar.com" })

      Projects.user_joined(user)

      ups = Projects.list_all_user_project(user)
      up = Enum.find(ups, fn up -> up.project_id == project.id end)
      assert up == nil
    end

  end

end
