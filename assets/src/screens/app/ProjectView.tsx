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
        <DeleteButton onClick={() => modalStore.deleteProjectModal.set(project)}>
          Delete Project
        </DeleteButton>
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

function Members({ project }: { project: Project }) {
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
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add user
          </button>
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
    </div>
  )
}
