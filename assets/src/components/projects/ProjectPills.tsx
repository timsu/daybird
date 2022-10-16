import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import Tooltip from '@/components/core/Tooltip'
import { paths } from '@/config'
import { projectStore } from '@/stores/projectStore'
import { classNames } from '@/utils'
import { ViewListIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default function () {
  const [pillsOpen, setPillsOpen] = useState(false)
  const projects = useStore(projectStore.activeProjects)
  const currentProject = useStore(projectStore.currentProject)

  useEffect(() => {
    if (!pillsOpen) return
    const onResize = () => setPillsOpen(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [pillsOpen])

  return (
    <>
      {/* small screen: only show current project */}
      <div
        className={classNames(
          'bg-gray-300 text-gray-900 text-sm whitespace-nowrap',
          'hover:bg-gray-400 hover:text-gray-900 cursor-pointer rounded-md px-4 py-2',
          'block sm:hidden'
        )}
        onClick={() => {
          setPillsOpen(true)
        }}
      >
        {currentProject?.name}
      </div>

      <div
        className={classNames(
          'justify-center gap-2',
          pillsOpen
            ? 'flex flex-col flex-0 bg-white top-1 absolute p-2 rounded border'
            : 'hidden sm:flex flex-1'
        )}
      >
        {projects.map((p, i) => (
          <div
            key={p.id}
            className={classNames(
              p.id == currentProject?.id
                ? 'bg-gray-300 text-gray-900'
                : 'bg-gray-100 text-gray-400',
              'hover:bg-gray-400 hover:text-gray-900 cursor-pointer rounded-md px-4 py-2',
              'overflow-hidden whitespace-nowrap text-ellipsis text-sm min-w-[40px]'
            )}
            onClick={() => {
              projectStore.setCurrentProject(p)
              route(paths.TODAY)
              setPillsOpen(false)
            }}
          >
            {p.name}
          </div>
        ))}
        <Tooltip message={pillsOpen ? '' : 'Manage Projects'} placement="right">
          <div
            className={classNames(
              'text-gray-400 text-sm flex',
              'hover:bg-gray-400 hover:text-gray-900 cursor-pointer rounded-md p-2',
              'overflow-hidden whitespace-nowrap'
            )}
            onClick={() => {
              route(paths.PROJECTS)
            }}
          >
            <ViewListIcon className="w-5 h-5" />
            {pillsOpen && <div className="ml-2">Manage Projects</div>}
          </div>
        </Tooltip>
      </div>
    </>
  )
}
