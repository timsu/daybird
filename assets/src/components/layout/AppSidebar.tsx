import { JSX } from 'preact'
import { Link } from 'preact-router'
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
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'
import {
    BriefcaseIcon, CalendarIcon, CheckCircleIcon, CheckIcon, DocumentAddIcon, DocumentIcon,
    FolderAddIcon, FolderIcon, HomeIcon, PlusIcon, ViewListIcon
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
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Links />
        <CurrentProject />
      </div>
    </div>
  )
}

function Links() {
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const projects = useStore(projectStore.projects)

  const projectItems: NavItem[] = projectsExpanded
    ? projects.map((p) => ({
        name: p.name!,
        href: paths.PROJECTS + '/' + p.id,
        indent: 35,
      }))
    : []

  let navigation: NavItem[] = [
    { name: 'Dashboard', href: paths.APP, icon: HomeIcon },
    {
      name: 'Projects',
      href: paths.PROJECTS,
      icon: BriefcaseIcon,
    },
    ...projectItems,
    projects.length > 0 && {
      name: 'Tasks',
      href: paths.TASKS,
      icon: ViewListIcon,
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
              {/* {item.href == paths.PROJECTS && (
                <ProjectExpandCheck
                  url={url}
                  expanded={projectsExpanded}
                  setExpanded={setProjectsExpanded}
                />
              )} */}
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

function ProjectExpandCheck({
  url,
  expanded,
  setExpanded,
}: {
  url: string
  expanded: boolean
  setExpanded: (b: boolean) => void
}) {
  useEffect(() => {
    const active = url.startsWith(paths.PROJECTS)
    if (active != expanded) setExpanded(active)
  }, [url, expanded])
  return null
}

function CurrentProject() {
  const project = useStore(projectStore.currentProject)

  if (!project) return null

  const onNewFile = () => {
    modalStore.newFileModal.set('file')
  }
  const onNewFolder = () => {
    modalStore.newFileModal.set('folder')
  }
  const onNewDailyFile = () => fileStore.newDailyFile()

  return (
    <>
      <div class="border-t border-t-gray-500 p-4 flex flex-row items-center text-gray-400 font-semibold text-sm">
        <div class="mr-1">{project.name.toUpperCase()}</div>
        <Pressable tooltip="New File" onClick={onNewFile}>
          <DocumentAddIcon class="h-4 w-4" />
        </Pressable>
        <div class="mr-1" />
        <Pressable tooltip="New File with Today's Date" tooltipWidth={200} onClick={onNewDailyFile}>
          <CalendarIcon class="h-4 w-4" />
        </Pressable>
        {/* <Pressable tooltip="New Folder" onClick={onNewFolder}>
          <FolderAddIcon class="h-4 w-4" />
        </Pressable> */}
      </div>

      <FileTree projectId={project.id} />
      <NewFileModal />
      <DeleteFileModal />
    </>
  )
}
