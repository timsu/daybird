import { h } from 'preact'
import { Link } from 'preact-router'
import Match from 'preact-router/match'

import {
    ContextMenu, ContextMenuItem, ContextMenuTrigger, ContextMenuWithData, MenuContext,
    triggerContextMenu
} from '@/components/core/ContextMenu'
import { paths } from '@/config'
import { File, FileType, TreeFile } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { getProject, projectStore } from '@/stores/projectStore'
import { classNames } from '@/utils'
import {
    ChevronDownIcon, ChevronRightIcon, DotsHorizontalIcon, FolderIcon, FolderOpenIcon
} from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type ContextMenuArgs = { file: File; projectId: string }

export default ({ projectId }: { projectId: string }) => {
  const files = useStore(fileStore.fileTree)[projectId]
  const project = useStore(projectStore.projectMap)[projectId]

  if (!files) return null

  return (
    <nav className="px-2 space-y-1 mb-10">
      {files.length == 0 && <div className="text-gray-500 italic text-sm px-2">Empty</div>}
      <FileTree projectId={projectId} nodes={files} indent={0} />
    </nav>
  )
}

function FileTree({
  nodes,
  indent,
  projectId,
}: {
  nodes: TreeFile[]
  indent: number
  projectId: string
}) {
  return (
    <>
      {nodes.map((node) => {
        const item = node.file
        if (item.type == FileType.DOC) {
          const href = `${paths.DOC}/${projectId}/${item.id}`
          return (
            <ContextMenuTrigger
              id="file-tree-doc"
              key={item.id}
              data={{ file: item, projectId: projectId }}
            >
              <Match path={href}>
                {({ url }: { url: string }) => {
                  const matches = location.pathname == encodeURI(href)
                  return (
                    <Link
                      key={item.name}
                      href={href}
                      className={classNames(
                        matches ? 'bg-blue-200 ' : ' hover:bg-blue-300 ',
                        'text-gray-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all'
                      )}
                      style={{ marginLeft: indent * 10 }}
                    >
                      {item.name}
                      {matches && (
                        <>
                          <div class="grow" />
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              triggerContextMenu(e.clientX - 200, e.clientY, 'file-tree-doc', item)
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
        } else if (item.type == FileType.FOLDER) {
          return <FolderNode {...{ indent, node, projectId }} />
        } else {
          return null
        }
      })}
    </>
  )
}

function FolderNode({
  indent,
  node,
  projectId,
}: {
  indent: number
  node: TreeFile
  projectId: string
}) {
  const item = node.file

  const expansionKey = projectId + '/' + item.id
  const expanded = useStore(fileStore.expanded)[expansionKey]

  const setExpanded = (setting: boolean) => {
    fileStore.setExpanded(expansionKey, setting)
  }

  const Icon = expanded ? ChevronDownIcon : ChevronRightIcon

  return (
    <>
      <ContextMenuTrigger
        id="file-tree-folder"
        key={item.id}
        data={{ file: item, projectId: projectId }}
      >
        <div
          className="text-gray-700 hover:bg-gray-300 group flex
        items-center px-2 py-2 text-sm font-medium rounded-md transition-all cursor-pointer"
          style={{ marginLeft: indent * 10 }}
          onClick={() => setExpanded(!expanded)}
        >
          <Icon className="text-gray-500  mr-2 flex-shrink-0 h-4 w-4" aria-hidden="true" />
          {item.name}
        </div>
      </ContextMenuTrigger>
      {expanded && <FileTree nodes={node.nodes!} indent={indent + 1} projectId={projectId} />}
    </>
  )
}

export function FileContextMenu() {
  return (
    <>
      <ContextMenuWithData id="file-tree-doc">
        {({ file, projectId }: ContextMenuArgs) => (
          <>
            <ContextMenuItem
              onClick={() =>
                modalStore.renameFileModal.set({
                  project: getProject(projectId),
                  file,
                })
              }
            >
              Rename File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                modalStore.deleteFileModal.set({ project: getProject(projectId), file })
              }
            >
              Delete File
            </ContextMenuItem>
          </>
        )}
      </ContextMenuWithData>
      <ContextMenuWithData id="file-tree-folder">
        {({ file, projectId }: ContextMenuArgs) => (
          <>
            <ContextMenuItem
              onClick={() =>
                modalStore.newFileModal.set({
                  project: getProject(projectId),
                  type: FileType.DOC,
                  parent: file.id,
                })
              }
            >
              New File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                modalStore.newFileModal.set({
                  project: getProject(projectId),
                  type: FileType.FOLDER,
                  parent: file.id,
                })
              }
            >
              New Folder
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                modalStore.deleteFileModal.set({ project: getProject(projectId), file })
              }
            >
              Delete Folder
            </ContextMenuItem>
          </>
        )}
      </ContextMenuWithData>
    </>
  )
}
