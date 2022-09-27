import { useEffect, useState } from 'preact/hooks'

import Alphatar from '@/components/core/Alphatar'
import DeleteButton from '@/components/core/DeleteButton'
import Helmet from '@/components/core/Helmet'
import DeleteProjectModal from '@/components/modals/DeleteProjectModal'
import { Project } from '@/models'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { MailIcon } from '@heroicons/react/solid'
import { useStore } from '@nanostores/preact'

type Props = {
  id?: string
  path: string
}
export default ({ id }: Props) => {
  const project = useStore(projectStore.currentProject)

  useEffect(() => {
    if (id) {
      projectStore.fetchProjectDetails(id)
    }
  }, [id])

  if (!project || project?.id != id) return null

  return (
    <div className="py-6">
      <Helmet title={`Project | ${project.name}`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {project.name} ({project.shortcode})
        </h1>
      </div>

      <div className="h-8" />

      <Members project={project} />

      <div className="h-8" />

      <div className="max-w-7xl mt-20 mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-5">Dangerous Stuff</h1>
        <div className="flex gap-8">
          <ArchiveProject project={project} />
          <DeleteProject project={project} />
        </div>
      </div>

      <DeleteProjectModal />
    </div>
  )
}

/* This example requires Tailwind CSS v2.0+ */
const people = [
  {
    name: 'Lindsay Walton',
    title: 'Front-end Developer',
    department: 'Optimization',
    email: 'lindsay.walton@example.com',
    role: 'Member',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  // More people...
]

type ProjectArgs = {
  project: Project
}

function Members({ project }: ProjectArgs) {
  if (!project.members) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Collaborators</h1>
          <p className="mt-2 text-sm text-gray-700">
            Invite people to this project to collaborate on notes and tasks. Members have full
            access to all notes in this project.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
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
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
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
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {member.role}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {/* <a href="#" className="text-indigo-600 hover:text-indigo-900">
                          Edit<span className="sr-only">, {member.name}</span>
                        </a> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <InviteCollaborator />
    </div>
  )
}

function InviteCollaborator() {
  return (
    <div className="bg-white shadow sm:rounded-lg mt-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Invite Collaborator</h3>
        <div className="mt-2 text-sm text-gray-500">
          <p>
            You can invite new or existing users. No emails are sent, invited users will need to
            sign in to see the project.
          </p>
        </div>
        <form className="mt-5 sm:flex sm:items-center">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Add
          </button>
        </form>
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
