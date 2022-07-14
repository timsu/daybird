import Match from 'preact-router/match'

import LogoDark from '@/components/core/LogoDark'
import { paths } from '@/config'
import { classNames } from '@/utils'
import { DocumentIcon, FolderIcon, HomeIcon } from '@heroicons/react/outline'

const navigation = [
  { name: 'Dashboard', href: paths.APP, icon: HomeIcon },
  {
    name: 'Projects',
    href: paths.PROJECTS,
    icon: FolderIcon,
  },
  {
    name: 'Doc',
    href: paths.DOC,
    icon: DocumentIcon,
  },
]

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
        <nav className="flex-1 px-2 py-4 space-y-1">
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
                >
                  <item.icon
                    className={classNames(
                      matches ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              )}
            </Match>
          ))}
        </nav>
      </div>
    </div>
  )
}
