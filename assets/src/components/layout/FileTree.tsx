import { h } from 'preact'
import { Link } from 'preact-router'
import Match from 'preact-router/match'

import {
    ContextMenu, ContextMenuItem, ContextMenuTrigger, ContextMenuWithData, MenuContext,
    triggerContextMenu
} from '@/components/core/ContextMenu'
import { File, paths } from '@/config'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { classNames } from '@/utils'
import { DotsHorizontalIcon, FolderIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default ({ projectId }: { projectId: string }) => {
  const files = useStore(fileStore.files)[projectId]

  if (!files) return null

  return (
    <nav className="px-2 space-y-1 mb-10">
      <ContextMenuWithData id="file-tree-menu">
        {(file: File) => (
          <>
            <ContextMenuItem onClick={() => modalStore.renameFileModal.set(file)}>
              Rename File
            </ContextMenuItem>
            <ContextMenuItem onClick={() => modalStore.deleteFileModal.set(file)}>
              Delete File
            </ContextMenuItem>
          </>
        )}
      </ContextMenuWithData>
      {files.map((item) => {
        if (item.type == 'doc') {
          const href = `${paths.DOC}/${projectId}/${item.path}`
          return (
            <ContextMenuTrigger id="file-tree-menu" key={item.path} data={item}>
              <Match path={href}>
                {({ url }: { url: string }) => {
                  const matches = location.pathname == encodeURI(href)
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
                      {matches && (
                        <>
                          <div class="grow" />
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              triggerContextMenu(e.clientX - 200, e.clientY, 'file-tree-menu', item)
                            }}
                          >
                            <DotsHorizontalIcon class="w-4 h-4" />
                          </div>
                        </>
                      )}
                    </Link>
                  )
                }}
              </Match>
            </ContextMenuTrigger>
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
