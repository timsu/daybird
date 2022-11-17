import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import { API } from '@/api'
import Alphatar from '@/components/core/Alphatar'
import DeleteButton from '@/components/core/DeleteButton'
import ErrorMessage from '@/components/core/ErrorMessage'
import Helmet from '@/components/core/Helmet'
import Input from '@/components/core/Input'
import Pressable from '@/components/core/Pressable'
import AppHeader from '@/components/layout/AppHeader'
import DeleteProjectModal from '@/components/modals/DeleteProjectModal'
import { paths } from '@/config'
import { Project, ProjectMember, ProjectRole } from '@/models'
import { authStore } from '@/stores/authStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { makeInitials, unwrapError } from '@/utils'
import { MailIcon } from '@heroicons/react/solid'
import { useStore } from '@nanostores/preact'

type Props = {
  id?: string
  path: string
}
export default ({ id }: Props) => {
  const user = useStore(authStore.loggedInUser)
  const project = useStore(projectStore.currentProject)

  useEffect(() => {
    if (id) {
      projectStore.fetchProjectDetails(id)
    }
  }, [id])

  if (!project || project?.id != id) return null

  const isAdmin = project.members?.find((m) => m.id == user!.id)?.role == ProjectRole.ADMIN

  const projectArgs = { project, isAdmin }

  return (
    <>
      <Helmet title={`Project | ${project.name}`} />
      <AppHeader>
        <h1 className="text-2xl font-semibold text-gray-900">
          {project.name} ({project.shortcode})
        </h1>
      </AppHeader>

      <div class="w-full max-w-2xl px-6 pb-6">
        <div className="h-8" />

        <RenameProject {...projectArgs} />

        <div className="h-12" />

        <Members {...projectArgs} />

        <InviteCollaborator {...projectArgs} />

        <div className="h-6" />

        {isAdmin && (
          <div className="max-w-7xl mt-20 mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-5">Dangerous Stuff</h1>
            <div className="flex gap-8 flex-col md:flex-row">
              <ArchiveProject {...projectArgs} />
              <DeleteProject {...projectArgs} />
            </div>
          </div>
        )}

        <DeleteProjectModal />
      </div>
    </>
  )
}

type ProjectArgs = {
  project: Project
  isAdmin: boolean
}

function Members({ project, isAdmin }: ProjectArgs) {
  const user = useStore(authStore.loggedInUser)
  if (!project.members) return null

  const removeMember = (member: ProjectMember) => {
    API.projectRemoveMember(project, member.email, member.id).then(projectStore.onProjectUpdated)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Collaborators</h1>
        </div>
      </div>
      <div className="mt-2 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Role
                    </th>
                    {isAdmin && (
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-20">
                        <span className="sr-only">Edit</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {project.members.map((member) => (
                    <tr key={member.id || member.email}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {member.id ? (
                              <Alphatar id={member.id} text={member.name!} />
                            ) : (
                              <MailIcon className="h-8 w-8" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {member.name || member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {member.role}
                      </td>
                      {isAdmin && (
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {member.id != user!.id && (
                            <div className="text-indigo-600 hover:text-indigo-900">
                              <Pressable onClick={() => removeMember(member)}>
                                Remove
                                <span className="sr-only">, {member.name || member.email}</span>
                              </Pressable>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RenameProject({ project }: ProjectArgs) {
  const [name, setName] = useState<string>(project.name)
  const [shortcode, setShortcode] = useState<string>(project.shortcode)
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)

  const onSubmit = async (e: Event) => {
    e.preventDefault()

    if (!name) return setError('Name must not be blank')
    if (!shortcode || shortcode.trim().length > 4) return setError('Code must be 1 - 4 characters')

    try {
      setSubmitting(true)
      setSuccess(false)
      setError(undefined)
      const response = await API.updateProject(project, { name, shortcode })
      projectStore.onProjectUpdated(response)
      setName('')
      setShortcode('')
      setSuccess(true)
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const onNameChange = (e: Event) => {
    const name = (e.target as HTMLInputElement).value
    setName(name)
    setShortcode(makeInitials(name))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Rename Project</h1>
        </div>
      </div>
      <div className="mt-2">
        <ErrorMessage error={error} />

        <form className="mt-5 sm:flex sm:items-center select-none" onSubmit={onSubmit}>
          <input
            type="text"
            className="max-w-xs w-full mr-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={name}
            placeholder="New Project Name"
            onChange={onNameChange}
          />
          <input
            type="text"
            className="max-w-xs w-25 mr-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={shortcode}
            placeholder="Short code"
            onChange={(e) => setShortcode((e.target as HTMLInputElement).value.toUpperCase())}
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Rename
          </button>
        </form>

        {success && <div className="mt-2 text-green-600 font-semibold">Project Renamed!</div>}
      </div>
    </div>
  )
}

function InviteCollaborator({ project }: ProjectArgs) {
  const [email, setEmail] = useState<string>()
  const [role, setRole] = useState<ProjectRole>(ProjectRole.MEMBER)
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)

  const onSubmit = async (e: Event) => {
    e.preventDefault()

    if (!email) return setError('Email is required')

    try {
      setSubmitting(true)
      setError(undefined)
      const response = await API.projectAddMember(project, email, role)
      projectStore.onProjectUpdated(response)
      setEmail(undefined)
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="bg-white shadow sm:rounded-lg mt-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Invite Collaborator</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>
              <b>Note:</b> No emails are sent, invited users will need to sign in to see the
              project.
            </p>
            <p className="mt-4">
              Members have access to all notes and can add other members. Admins can remove members,
              manage billing, and archive or delete the project.
            </p>
          </div>
          <ErrorMessage error={error} />

          <form className="mt-5 sm:flex sm:items-center select-none" onSubmit={onSubmit}>
            <input
              type="email"
              label="Email address"
              className="max-w-xs w-full mr-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            />

            <select
              value={role}
              onChange={(e) => setRole((e.target as HTMLInputElement).value as ProjectRole)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option label="Member" value={ProjectRole.MEMBER} />
              <option label="Admin" value={ProjectRole.ADMIN} />
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function ArchiveProject({ project }: ProjectArgs) {
  const toggleArchive = () => {
    projectStore.updateProject(project, {
      archived_at: project.archived_at ? null : new Date().toISOString(),
    })
  }
  return (
    <div className="flex-1 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Archive Project</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Hide project from the sidebar.</p>
        </div>
        <div className="mt-5">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-yellow-100 px-4 py-2 font-medium text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:text-sm"
            onClick={toggleArchive}
          >
            {project.archived_at ? 'Un-Archive' : 'Archive'} {project.name}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteProject({ project }: ProjectArgs) {
  return (
    <div className="flex-1 bg-white placeholder:bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Project</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Deleting projects is permanent.</p>
        </div>
        <div className="mt-5">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:text-sm"
            onClick={() => modalStore.deleteProjectModal.set(project)}
          >
            Delete {project.name}
          </button>
        </div>
      </div>
    </div>
  )
}
