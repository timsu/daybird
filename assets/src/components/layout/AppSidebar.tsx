import { JSX } from 'preact'
import Match from 'preact-router/match'

import LogoDark from '@/components/core/LogoDark'
import FileTree from '@/components/layout/FileTree'
import { paths } from '@/config'
import { projectStore } from '@/stores/projectStore'
import { classNames } from '@/utils'
import { BriefcaseIcon, DocumentIcon, FolderIcon, HomeIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type NavItem = {
  name: string
  href: string
  icon?: (props: any) => JSX.Element
  indent?: number
}

export default ({ darkHeader }: { darkHeader?: boolean }) => {
  const project = useStore(projectStore.currentProject)

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
        {project && (
          <>
            <div class="border-t border-t-gray-500 p-4 bg-gray-800 mt-4 text-gray-100 font-semibold text-sm">
              {project.name.toUpperCase()}
            </div>

            <FileTree />
          </>
        )}
      </div>
    </div>
  )
}

function Links() {
  const projects = useStore(projectStore.projects)

  const projectItems: NavItem[] = projects.map((p) => ({
    name: p.name!,
    href: paths.PROJECTS + '/' + p.id,
    indent: 35,
  }))

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: paths.APP, icon: HomeIcon },
    {
      name: 'Projects',
      href: paths.PROJECTS,
      icon: BriefcaseIcon,
    },
    ...projectItems,
  ]

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
