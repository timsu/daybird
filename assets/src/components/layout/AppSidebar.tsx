import { JSX } from 'preact'
import { Link, route } from 'preact-router'
import Match from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'

import { isTokenExpired } from '@/api'
import LogoDark from '@/components/core/LogoDark'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import FileTree from '@/components/layout/FileTree'
import DeleteFileModal from '@/components/modals/DeleteFileModal'
import NewFileModal from '@/components/modals/NewFileModal'
import { paths } from '@/config'
import { Project } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'
import {
    BriefcaseIcon, CalendarIcon, CheckCircleIcon, CheckIcon, DocumentAddIcon, DocumentIcon,
    DotsHorizontalIcon, FolderAddIcon, FolderIcon, HomeIcon, PlusIcon, ViewListIcon
} from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type NavItem = {
  name: string
  href: string
  icon?: (props: any) => JSX.Element
  indent?: number
}

export default ({ darkHeader }: { darkHeader?: boolean }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-800 select-none">
      <div
        className={classNames(
          darkHeader ? 'bg-gray-900' : '',
          'flex items-center h-16 flex-shrink-0 px-4'
        )}
      >
        <LogoDark class="w-[160px]" />
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar">
        <Links />
        <Projects />
      </div>
    </div>
  )
}

function Links() {
  let navigation: NavItem[] = [
    { name: 'Dashboard', href: paths.APP, icon: HomeIcon },
    {
      name: 'Tasks',
      href: paths.TASKS,
      icon: ViewListIcon,
    },
    {
      name: 'Projects',
      href: paths.PROJECTS,
      icon: BriefcaseIcon,
    },
  ].filter(Boolean) as NavItem[]

  return (
    <nav className="px-2 py-4 space-y-1">
      {navigation.map((item) => (
        <Match path={item.href}>
          {({ matches, url }: { matches: boolean; url: string }) => (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                url == item.href
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
              style={{ marginLeft: item.indent }}
            >
              {item.icon && (
                <item.icon
                  className={classNames(
                    url == item.href ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
              )}
              {item.name}
            </Link>
          )}
        </Match>
      ))}
    </nav>
  )
}

function Projects() {
  const projects = useStore(projectStore.projects)

  useEffect(() => {
    fileStore.loadExpanded()
  }, [])

  return (
    <>
      {projects.map((p) => (
        <ProjectTree key={p.id} project={p} />
      ))}
      <NewFileModal />
      <DeleteFileModal />
    </>
  )
}

function ProjectTree({ project }: { project: Project }) {
  const expanded = useStore(fileStore.expanded)[project.id]

  useEffect(() => {
    console.log('expanded value changed', expanded)
    if (expanded) fileStore.loadFiles(project)
  }, [expanded])

  const setExpanded = (setting: boolean) => {
    fileStore.setExpanded(project.id, setting)
  }

  if (!project) return null

  const onNewFile = (e: Event) => {
    e.stopPropagation()
    modalStore.newFileModal.set({ project, type: 'file' })
  }
  const onNewFolder = (e: Event) => {
    e.stopPropagation()
    modalStore.newFileModal.set({ project, type: 'folder' })
  }
  const onNewDailyFile = (e: Event) => {
    e.stopPropagation()
    fileStore.newDailyFile(project)
  }
  const openSettings = (e: Event) => {
    e.stopPropagation()
    route(paths.PROJECTS + '/' + project.id)
  }

  return (
    <>
      <div
        class="border-t border-t-gray-500 py-2 pl-4 pr-3 flex flex-row items-center text-gray-400
          font-semibold text-sm cursor-pressable hover:bg-gray-700 cursor-pointer "
        onClick={() => setExpanded(!expanded)}
      >
        <Tooltip class="grow mr-1 max-w-[200px]" message={expanded ? 'Collapse' : 'Expand'}>
          <div class="text-ellipsis">{project.name.toUpperCase()}</div>
        </Tooltip>
        <Pressable tooltip={{ message: 'New File', placement: 'left' }} onClick={onNewFile}>
          <DocumentAddIcon class="h-4 w-4" />
        </Pressable>
        <div class="mr-1" />
        <Pressable
          tooltip={{ message: "New File with Today's Date", width: 100, placement: 'left' }}
          onClick={onNewDailyFile}
        >
          <CalendarIcon class="h-4 w-4" />
        </Pressable>
        {/* <Pressable tooltip="New Folder" onClick={onNewFolder}>
          <FolderAddIcon class="h-4 w-4" />
        </Pressable> */}
        <Pressable tooltip={{ message: 'Settings', placement: 'left' }} onClick={openSettings}>
          <DotsHorizontalIcon class="h-4 w-4" />
        </Pressable>
      </div>

      {expanded && <FileTree projectId={project.id} />}
    </>
  )
}
