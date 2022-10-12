import { JSX } from 'preact'
import { Link, route } from 'preact-router'
import Match from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'

import LogoDark from '@/components/core/LogoDark'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import FileTree from '@/components/layout/FileTree'
import FileContextMenu from '@/components/menus/FileContextMenu'
import DeleteFileModal from '@/components/modals/DeleteFileModal'
import NewFileModal from '@/components/modals/NewFileModal'
import Calendar from '@/components/nav/Calendar'
import ProjectPills from '@/components/projects/ProjectPills'
import { paths } from '@/config'
import { FileType, Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { classNames, ctrlOrCommand } from '@/utils'
import { isMobile } from '@/utils/os'
import {
    BriefcaseIcon, CalendarIcon, CheckCircleIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon,
    ChevronUpIcon, CogIcon, DocumentAddIcon, DocumentIcon, DotsHorizontalIcon, FolderAddIcon,
    FolderIcon, HomeIcon, PlusIcon, SearchIcon, ViewListIcon
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
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar">
        <div className="flex flex-wrap gap-2 sm:hidden">
          <ProjectPills />
        </div>
        <Links />
        {/* <CalendarLink /> */}
        <Projects />
      </div>
    </div>
  )
}

function Links() {
  let navigation: NavItem[] = [
    { name: 'Today', href: paths.TODAY, icon: HomeIcon },
    {
      name: 'All Tasks',
      href: paths.TASKS + '/' + projectStore.currentProject.get()?.id,
      icon: CheckIcon,
    },
  ].filter(Boolean) as NavItem[]

  return (
    <nav className="px-2 space-y-1">
      <div className="flex-1 flex">
        <form
          className="w-full flex md:ml-0 bg-white rounded-md px-2 mt-2 mb-4 border hover:ring"
          action="#"
          method="GET"
        >
          <label htmlFor="search-field" className="sr-only">
            Navigate
          </label>
          <div className="relative w-full text-gray-400 focus-within:text-gray-600">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div
              className="w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-500
                focus:outline-none focus:placeholder-gray-400 focus:ring-0
                focus:border-transparent sm:text-sm cursor-pointer flex items-center"
              onClick={() => modalStore.quickFindModal.set(true)}
            >
              Navigate {!isMobile && `(${ctrlOrCommand()}+P)`}
            </div>
          </div>
        </form>
      </div>
      {navigation.map((item) => (
        <Match path={item.href}>
          {({ matches, url }: { matches: boolean; url: string }) => (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                url == item.href ? 'bg-blue-200 text-gray-900' : 'text-gray-700 hover:bg-blue-300',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
              style={{ marginLeft: item.indent }}
            >
              {item.icon && (
                <item.icon
                  className={classNames(
                    url == item.href ? 'text-gray-700' : 'text-gray-800',
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

function CalendarLink() {
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <nav className="px-2 space-y-1">
      <div
        className={classNames(
          'text-gray-700 hover:bg-blue-300',
          'group flex items-center px-2 py-2 text-sm font-medium rounded-md, cursor-pointer'
        )}
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <CalendarIcon className={'text-gray-800 mr-3 flex-shrink-0 h-6 w-6'} aria-hidden="true" />
        {showCalendar ? 'Hide ' : ''}Calendar
      </div>

      {showCalendar && <Calendar />}
    </nav>
  )
}

function Projects() {
  const project = useStore(projectStore.currentProject)

  if (!project) return null

  useEffect(() => {
    fileStore.loadExpanded()
  }, [])

  return (
    <>
      <ProjectTree project={project} />
      <NewFileModal />
      <DeleteFileModal />
      <FileContextMenu />
    </>
  )
}

function ProjectTree({ project }: { project: Project }) {
  if (!project) return null

  useEffect(() => {
    fileStore.loadFiles(project)
  }, [project.id])

  const onNewFile = (type: FileType) => (e: Event) => {
    e.stopPropagation()
    const currentFile = docStore.id.get()
    const currentProject = projectStore.currentProject.get()?.id == project.id
    const parent =
      currentProject && currentFile ? fileStore.idToFile.get()[currentFile]?.parent : undefined
    modalStore.newFileModal.set({ project, type, parent })
  }

  return (
    <>
      <div className="group flex flex-col flex-1">
        <div class="m-4 mb-2 text-gray-500 font-semibold text-sm">NOTES</div>

        <FileTree projectId={project.id} />

        <div className="flex-1" />

        <div className="flex m-2 opacity-100 sm:opacity-30 group-hover:opacity-100 transition-opacity">
          <Pressable className="flex-1" onClick={onNewFile(FileType.DOC)}>
            {/* <PlusIcon class="h-3 w-3" /> */}
            <div class="text-sm">+ File</div>
          </Pressable>

          <Pressable className="flex-1" onClick={onNewFile(FileType.FOLDER)}>
            {/* <PlusIcon class="h-3 w-3" /> */}
            <div class="text-sm">+ Folder</div>
          </Pressable>
        </div>
      </div>
    </>
  )
}
