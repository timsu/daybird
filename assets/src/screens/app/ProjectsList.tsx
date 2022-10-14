import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import NewProjectModal from '@/components/modals/NewProjectModal'
import { paths } from '@/config'
import { Project } from '@/models'
import NoProjects from '@/screens/app/NoProjects'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { classNames, makeInitials, mediumColorFor, pluralizeWithCount } from '@/utils'
import { DotsVerticalIcon, PlusIcon } from '@heroicons/react/solid'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}
export default (props: Props) => {
  const projects = useStore(projectStore.projects)

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 hover:bg-white md:px-8 mt-4">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
      </div>

      <div className="h-6" />

      <div className="px-4 sm:px-6 md:px-8">
        <ProjectList projects={projects} />

        {projects.length == 0 && <NoProjects />}

        <div className="mt-10 text-center">
          <Button onClick={() => modalStore.newProjectModal.set(true)}>
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Project
          </Button>
        </div>
      </div>

      <NewProjectModal />
    </div>
  )
}

type ProjectItem = Project & {
  href: string
  memberCount: number
  bgColor: string
}

function ProjectList({ projects }: { projects: Project[] }) {
  const projectItems: ProjectItem[] = projects.map((p, i) => ({
    ...p,
    href: paths.PROJECTS + '/' + p.id,
    memberCount: 1,
    bgColor: mediumColorFor(p.id),
  }))

  return (
    <div>
      <Helmet title="Projects" />
      <ul role="list" className="grid grid-cols-2 gap-5 sm:gap-6">
        {projectItems.map((project) => (
          <a href={project.href}>
            <li key={project.name} className="col-span-1 flex shadow-sm rounded-md">
              <div
                className={classNames(
                  'flex-shrink-0 flex items-center justify-center w-16 text-white text-sm font-medium rounded-l-md'
                )}
                style={{ background: project.bgColor }}
              >
                {project.shortcode}
              </div>
              <div
                className="flex-1 flex items-center justify-between border-t border-r border-b
                 border-gray-200 bg-white rounded-r-md truncate hover:bg-gray-200"
              >
                <div className="flex-1 px-4 py-2 text-sm truncate">
                  <div
                    className={classNames(
                      project.archived_at ? 'text-gray-500' : 'text-gray-900',
                      'font-medium hover:text-gray-600'
                    )}
                  >
                    {project.name}
                    {project.archived_at ? ' (archived)' : null}
                  </div>
                  <p className="text-gray-500">
                    {pluralizeWithCount('member', project.memberCount)}
                  </p>
                </div>
              </div>
            </li>
          </a>
        ))}
      </ul>
    </div>
  )
}
