import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import Tooltip from '@/components/core/Tooltip'
import { paths } from '@/config'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { classNames, mediumColorFor } from '@/utils'
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

  if (!currentProject) return null

  const bgColor = mediumColorFor(currentProject.id)

  return (
    <div class="relative">
      <div
        className={classNames(
          'm-1 flex items-center text-gray-900 text-sm whitespace-nowrap',
          'hover:bg-gray-300/50 hover:text-gray-900 cursor-pointer rounded-md px-1 py-2',
          'block'
        )}
        onClick={() => {
          setPillsOpen((x) => !x)
        }}
      >
        <div
          className={classNames('text-white text-sm font-medium rounded-md mr-2 px-2 py-1')}
          style={{ background: bgColor }}
        >
          {currentProject.shortcode}
        </div>
        <div class="font-semibold">{currentProject.name}</div>
      </div>

      <div
        className={classNames(
          'justify-center gap-2 z-20 bg-white flex-1 w-52 shadow',
          pillsOpen ? 'flex flex-col left-0 absolute p-2 rounded border' : 'hidden flex-1'
        )}
      >
        <div class="uppercase font-bold text-gray-400 text-xs">Select Project</div>
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
              route(uiStore.insightLoop ? paths.JOURNAL : paths.TODAY)
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
              setPillsOpen(false)
            }}
          >
            <ViewListIcon className="w-5 h-5" />
            {pillsOpen && <div className="ml-2">Manage Projects</div>}
          </div>
        </Tooltip>
      </div>
    </div>
  )
}
