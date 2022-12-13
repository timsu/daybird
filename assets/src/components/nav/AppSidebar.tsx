import { format } from 'date-fns'
import { JSX } from 'preact'
import { Link, route } from 'preact-router'
import Match from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'
import uniqolor from 'uniqolor'

import Pressable from '@/components/core/Pressable'
import FileContextMenu from '@/components/menus/FileContextMenu'
import DeleteFileModal from '@/components/modals/DeleteFileModal'
import NewFileModal from '@/components/modals/NewFileModal'
import FileTree from '@/components/nav/FileTree'
import ProjectDropdown from '@/components/projects/ProjectDropdown'
import ProjectPills from '@/components/projects/ProjectPills'
import { paths } from '@/config'
import { FileType, Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { classNames, ctrlOrCommand } from '@/utils'
import { isMobile } from '@/utils/os'
import {
    CalendarIcon, ChartBarIcon, CheckIcon, HomeIcon, LightBulbIcon, PencilIcon,
    PresentationChartLineIcon, SearchIcon
} from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type NavItem = {
  name: string
  href: string
  icon?: (props: any) => JSX.Element
  indent?: number
}

export default ({ showHideButton }: { showHideButton?: boolean }) => {
  const projects = useStore(projectStore.activeProjects)
  const date = useStore(uiStore.calendarDate)
  const insightLoop = uiStore.insightLoop

  // generate two random colors from today's date
  const gradientColor1 = uniqolor(format(date, 'd MMMM EEEE'), { lightness: [85, 97] }).color
  const gradientColor2 = uniqolor(format(date, 'EEEE M<MM d'), { lightness: [85, 97] }).color

  const style = {
    background: insightLoop
      ? '#fafafa'
      : `linear-gradient(320deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`,
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 select-none" style={style}>
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar">
        {!projects.length ? (
          <>
            <div className="p-4 italic text-sm">Please create a project to continue.</div>
          </>
        ) : (
          <>
            {insightLoop && <div className="text-blue-600 font-bold p-3">InsightLoop</div>}
            <ProjectDropdown />
            <Links />
            <Projects />
          </>
        )}
      </div>
    </div>
  )
}

function Links() {
  const insightLoop = uiStore.insightLoop
  let navigation: NavItem[] = insightLoop
    ? [
        { name: 'Journal', href: paths.JOURNAL, icon: PencilIcon },
        { name: 'Insights', href: paths.INSIGHTS, icon: LightBulbIcon },
        { name: 'Stats', href: paths.STATS, icon: ChartBarIcon },
      ]
    : [
        { name: 'Today', href: paths.TODAY, icon: HomeIcon },
        {
          name: 'All Tasks',
          href: paths.TASKS + '/' + projectStore.currentProject.get()?.id,
          icon: CheckIcon,
        },
        { name: 'Journal', href: paths.DB_JOURNAL, icon: PencilIcon },
        { name: 'Insights', href: paths.DB_INSIGHTS, icon: LightBulbIcon },
      ]

  return (
    <nav className="px-2 space-y-1">
      {!insightLoop && (
        <div className="flex-1 flex">
          <form
            className="w-full flex md:ml-0 bg-white/80 rounded-md px-2 mt-2 mb-4 border hover:ring"
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
      )}
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

function Projects() {
  const project = useStore(projectStore.currentProject)

  // in order to nest context menu inside sidebar, we must mount it inside the other dialog
  const sidebarOpen = useStore(uiStore.sidebarMenuOpen)

  if (!project) return null

  useEffect(() => {
    fileStore.loadExpanded()
  }, [])

  return (
    <>
      <ProjectTree project={project} />
      {!sidebarOpen && <SidebarModals />}
    </>
  )
}

export function SidebarModals() {
  return (
    <>
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
    const currentFileId = docStore.doc.get()?.id
    const currentFile = currentFileId && fileStore.idToFile.get()[currentFileId]
    const currentProject = projectStore.currentProject.get()?.id == project.id

    const parent =
      currentProject && currentFile && !fileStore.isJournalFolder(currentFile)
        ? currentFile.parent
        : undefined
    modalStore.newFileModal.set({ project, type, parent })
  }

  return (
    <>
      <div className="group flex flex-col flex-1">
        <div class="m-4 mb-2 text-gray-500 font-semibold text-sm">NOTES</div>

        <FileTree projectId={project.id} />

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
