import { JSX } from 'preact'
import Match from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'

import { isTokenExpired } from '@/api'
import LogoDark from '@/components/core/LogoDark'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import FileTree from '@/components/layout/FileTree'
import NewFileModal from '@/components/modals/NewFileModal'
import { paths } from '@/config'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { classNames } from '@/utils'
import {
    BriefcaseIcon, DocumentAddIcon, DocumentIcon, FolderAddIcon, FolderIcon, HomeIcon, PlusIcon
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
    <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
      <div
        className={classNames(
          darkHeader ? 'bg-gray-900' : '',
          'flex items-center h-16 flex-shrink-0 px-4'
        )}
      >
        <LogoDark width={160} />
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Links />
        <CurrentProject />
      </div>
    </div>
  )
}

function Links() {
  const [projectsExpanded, setProjectsExpanded] = useState(location.pathname == paths.PROJECTS)

  let navigation: NavItem[] = [
    { name: 'Dashboard', href: paths.APP, icon: HomeIcon },
    {
      name: 'Projects',
      href: paths.PROJECTS,
      icon: BriefcaseIcon,
    },
  ]

  if (projectsExpanded) {
    const projects = useStore(projectStore.projects)
    const projectItems: NavItem[] = projects.map((p) => ({
      name: p.name!,
      href: paths.PROJECTS + '/' + p.id,
      indent: 35,
    }))
    navigation = [...navigation, ...projectItems]
  }

  return (
    <nav className="px-2 py-4 space-y-1">
      {navigation.map((item) => (
        <Match path={item.href}>
          {({ matches }: { matches: boolean }) => (
            <a
              key={item.name}
              href={item.href}
              className={classNames(
                matches
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
              style={{ marginLeft: item.indent }}
            >
              {item.href == paths.PROJECTS && (
                <ProjectExpandCheck
                  active={matches}
                  expanded={projectsExpanded}
                  setExpanded={setProjectsExpanded}
                />
              )}
              {item.icon && (
                <item.icon
                  className={classNames(
                    matches ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
              )}
              {item.name}
            </a>
          )}
        </Match>
      ))}
    </nav>
  )
}

function ProjectExpandCheck({
  active,
  expanded,
  setExpanded,
}: {
  active: boolean
  expanded: boolean
  setExpanded: (b: boolean) => void
}) {
  useEffect(() => {
    if (active != expanded) setExpanded(active)
  }, [active, expanded])
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

  return (
    <>
      <div class="border-t border-t-gray-500 p-4 flex flex-row items-center text-gray-400 font-semibold text-sm">
        <div class="mr-1">{project.name.toUpperCase()}</div>
        <Pressable tooltip="New File" onClick={onNewFile}>
          <DocumentAddIcon class="h-4 w-4" />
        </Pressable>
        <div class="mr-1" />
        <Pressable tooltip="New Folder" onClick={onNewFolder}>
          <FolderAddIcon class="h-4 w-4" />
        </Pressable>
      </div>

      <FileTree />
      <NewFileModal />
    </>
  )
}
