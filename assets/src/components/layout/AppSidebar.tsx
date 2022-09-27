import { JSX } from 'preact'
import { Link, route } from 'preact-router'
import Match from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'
import uniqolor from 'uniqolor'

import { isTokenExpired } from '@/api'
import LogoDark from '@/components/core/LogoDark'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import FileTree, { FileContextMenu } from '@/components/layout/FileTree'
import DeleteFileModal from '@/components/modals/DeleteFileModal'
import NewFileModal from '@/components/modals/NewFileModal'
import { paths } from '@/config'
import { FileType, Project } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'
import {
    BriefcaseIcon, CalendarIcon, CheckCircleIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon,
    ChevronUpIcon, CogIcon, DocumentAddIcon, DocumentIcon, DotsHorizontalIcon, FolderAddIcon,
    FolderIcon, HomeIcon, PlusIcon, ViewListIcon
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
    <div className="flex-1 flex flex-col min-h-0  select-none">
      <div className={classNames('flex items-center h-16 flex-shrink-0 px-4')}>
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
                  ? 'bg-blue-300 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-400 hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
              style={{ marginLeft: item.indent }}
            >
              {item.icon && (
                <item.icon
                  className={classNames(
                    url == item.href ? 'text-gray-700' : 'text-gray-800 group-hover:text-gray-300',
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
      <FileContextMenu />
    </>
  )
}

function ProjectTree({ project }: { project: Project }) {
  const expanded = useStore(fileStore.expanded)[project.id]

  useEffect(() => {
    if (expanded) fileStore.loadFiles(project)
  }, [expanded])

  const setExpanded = (setting: boolean) => {
    fileStore.setExpanded(project.id, setting)
  }

  if (!project) return null

  const active = location.pathname == `${paths.PROJECTS}/${project.id}`

  const onNewFile = (e: Event) => {
    e.stopPropagation()
    modalStore.newFileModal.set({ project, type: FileType.DOC })
  }
  const onNewFolder = (e: Event) => {
    e.stopPropagation()
    modalStore.newFileModal.set({ project, type: FileType.FOLDER })
  }
  const onNewDailyFile = (e: Event) => {
    e.stopPropagation()
    fileStore.newDailyFile(project)
  }

  return (
    <>
      <div
        class={classNames(
          'rounded-md flex bg-gray-200 mx-2',
          'text-gray-700 font-semibold text-sm cursor-pressable hover:bg-gray-300 cursor-pointer'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* <div
          className={classNames(
            'flex-shrink-0 flex items-center justify-center w-16 text-white text-sm font-medium rounded-l-md'
          )}
          style={{ background: uniqolor(project.id).color }}
        >
          {project.shortcode}
        </div> */}
        <Tooltip
          class="py-2 px-2 flex-row items-center grow mr-1 max-w-[200px]"
          message={expanded ? 'Collapse' : 'Expand'}
        >
          <div class="mr-1 text-ellipsis">{project.name.toUpperCase()}</div>
          {expanded ? <ChevronDownIcon class="h-3 w-3" /> : <ChevronRightIcon class="h-3 w-3" />}
        </Tooltip>
      </div>

      {expanded && (
        <>
          <div className="flex m-2 gap-2 text-gray-500">
            <Pressable
              tooltip={{ message: 'New File', tooltipClass: 'min-w-[75px]' }}
              onClick={onNewFile}
            >
              <DocumentAddIcon class="h-6 w-6" />
            </Pressable>

            <Pressable
              tooltip={{
                message: "New File with Today's Date",
                tooltipClass: 'min-w-[120px]',
              }}
              onClick={onNewDailyFile}
            >
              <CalendarIcon class="h-6 w-6" />
            </Pressable>

            <Pressable
              tooltip={{ message: 'New Folder', tooltipClass: 'min-w-[100px]' }}
              onClick={onNewFolder}
            >
              <FolderAddIcon class="h-6 w-6" />
            </Pressable>

            <Pressable
              tooltip={{ message: 'Settings & Members', tooltipClass: 'min-w-[100px]' }}
              onClick={() => route(paths.PROJECTS + '/' + project.id)}
            >
              <CogIcon class="h-6 w-6" />
            </Pressable>
          </div>
          <FileTree projectId={project.id} />
        </>
      )}

      <div className="h-5" />
    </>
  )
}
