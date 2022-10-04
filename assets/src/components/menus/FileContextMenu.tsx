import copy from 'copy-to-clipboard'

import { ContextMenuItem, ContextMenuWithData } from '@/components/core/ContextMenu'
import { paths } from '@/config'
import { File, FileType, Project, TreeFile } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { getProject } from '@/stores/projectStore'

type ContextMenuArgs = { file: File; projectId: string }

export default function () {
  return (
    <>
      <ContextMenuWithData id="file-tree-doc">
        {({ file, projectId, ...rest }: ContextMenuArgs) => (
          <>
            <ContextMenuItem
              onClick={() => copy(`${location.origin}${paths.DOC}/${projectId}/${file.id}`)}
            >
              Copy File Link
            </ContextMenuItem>
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
              onClick={() => {
                const expansionKey = projectId + '/' + file.id
                fileStore.setExpanded(expansionKey, true)

                modalStore.newFileModal.set({
                  project: getProject(projectId),
                  type: FileType.DOC,
                  parent: file.id,
                })
              }}
            >
              New File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                const expansionKey = projectId + '/' + file.id
                fileStore.setExpanded(expansionKey, true)

                modalStore.newFileModal.set({
                  project: getProject(projectId),
                  type: FileType.FOLDER,
                  parent: file.id,
                })
              }}
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
