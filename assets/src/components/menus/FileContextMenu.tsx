import copy from 'copy-to-clipboard'

import { ContextMenuItem, ContextMenuWithData } from '@/components/core/ContextMenu'
import { paths } from '@/config'
import { File, FileType, Project, TreeFile } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { getProject } from '@/stores/projectStore'
import {
    ArchiveIcon, DocumentAddIcon, FolderAddIcon, LinkIcon, PencilIcon, TrashIcon
} from '@heroicons/react/outline'

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
              <LinkIcon class="h-4 w-4 mr-2" />
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
              <PencilIcon class="h-4 w-4 mr-2" />
              Rename File
            </ContextMenuItem>
            <hr />

            <ContextMenuItem
              onClick={() =>
                modalStore.deleteFileModal.set({
                  project: getProject(projectId),
                  file,
                  archive: true,
                })
              }
            >
              <ArchiveIcon class="h-4 w-4 mr-2 text-orange-500" />
              Archive File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                modalStore.deleteFileModal.set({ project: getProject(projectId), file })
              }
            >
              <TrashIcon class="h-4 w-4 mr-2 text-red-500" />
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
              <DocumentAddIcon class="h-4 w-4 mr-2" />
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
              <FolderAddIcon class="h-4 w-4 mr-2" />
              New Folder
            </ContextMenuItem>

            <hr />

            <ContextMenuItem
              onClick={() =>
                modalStore.renameFileModal.set({
                  project: getProject(projectId),
                  file,
                })
              }
            >
              <PencilIcon class="h-4 w-4 mr-2" />
              Rename Folder
            </ContextMenuItem>

            <hr />
            <ContextMenuItem
              onClick={() =>
                modalStore.deleteFileModal.set({ project: getProject(projectId), file })
              }
            >
              <TrashIcon class="h-4 w-4 mr-2 text-red-500" />
              Delete Folder
            </ContextMenuItem>
          </>
        )}
      </ContextMenuWithData>
      <ContextMenuWithData id="file-tree-root">
        {({ projectId }: ContextMenuArgs) => (
          <>
            <ContextMenuItem
              onClick={() => {
                modalStore.newFileModal.set({
                  project: getProject(projectId),
                  type: FileType.DOC,
                })
              }}
            >
              <DocumentAddIcon class="h-4 w-4 mr-2" />
              New File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                modalStore.newFileModal.set({
                  project: getProject(projectId),
                  type: FileType.FOLDER,
                })
              }}
            >
              <FolderAddIcon class="h-4 w-4 mr-2" />
              New Folder
            </ContextMenuItem>
          </>
        )}
      </ContextMenuWithData>
    </>
  )
}
