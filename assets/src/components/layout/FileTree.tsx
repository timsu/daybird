import { Link } from 'preact-router'
import Match from 'preact-router/match'
import { CSSTransition, TransitionGroup } from 'preact-transitioning'

import { paths } from '@/config'
import { fileStore } from '@/stores/fileStore'
import { classNames } from '@/utils'
import { FolderIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default ({ projectId }: { projectId: string }) => {
  const files = useStore(fileStore.files)

  return (
    <nav className="flex-1 px-2 space-y-1">
      {files.map((item) => {
        if (item.type == 'doc') {
          const href = `${paths.DOC}/${projectId}/${item.path}`
          return (
            <Match key={item.path} path={href}>
              {({ url }: { url: string }) => {
                const matches = url == encodeURI(href)
                return (
                  <Link
                    key={item.name}
                    href={href}
                    className={classNames(
                      matches
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all'
                    )}
                    style={{ marginLeft: item.depth * 20 }}
                  >
                    {item.name}
                  </Link>
                )
              }}
            </Match>
          )
        } else if (item.type == 'folder') {
          return (
            <div
              className="text-gray-300 hover:bg-gray-700 hover:text-white group flex
                    items-center px-2 py-2 text-sm font-medium rounded-md transition-all"
              style={{ marginLeft: item.depth * 20 }}
            >
              <FolderIcon
                className="text-gray-400 group-hover:text-gray-300 mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              {item.name}
            </div>
          )
        } else {
          return null
        }
      })}
    </nav>
  )
}
