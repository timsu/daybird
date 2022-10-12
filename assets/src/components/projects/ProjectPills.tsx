import { route } from 'preact-router'

import Tooltip from '@/components/core/Tooltip'
import { paths } from '@/config'
import { projectStore } from '@/stores/projectStore'
import { classNames } from '@/utils'
import { ViewListIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default function () {
  const projects = useStore(projectStore.projects).filter((p) => !p.archived_at)
  const currentProject = useStore(projectStore.currentProject)

  return (
    <>
      {projects.map((p) => (
        <div
          key={p.id}
          className={classNames(
            p.id == currentProject?.id ? 'bg-gray-300 text-gray-900' : 'bg-gray-100 text-gray-400',
            'hover:bg-gray-400 hover:text-gray-900 cursor-pointer rounded-md px-4 py-2',
            'overflow-hidden whitespace-nowrap text-ellipsis text-sm min-w-[40px]'
          )}
          onClick={() => {
            projectStore.setCurrentProject(p)
            route(paths.TODAY)
          }}
        >
          {p.name}
        </div>
      ))}
      <Tooltip message="Manage Projects" placement="left">
        <div
          className={classNames(
            'text-gray-400',
            'hover:bg-gray-400 hover:text-gray-900 cursor-pointer rounded-md p-2',
            'overflow-hidden whitespace-nowrap'
          )}
          onClick={() => {
            route(paths.PROJECTS)
          }}
        >
          <ViewListIcon className="w-5 h-5" />
        </div>
      </Tooltip>
    </>
  )
}
