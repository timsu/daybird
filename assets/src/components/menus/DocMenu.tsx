import { ContextMenuItem, ContextMenuWithData } from '@/components/core/ContextMenu'
import { paths } from '@/config'
import { Project, Task, TaskType } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import {
    ArchiveIcon, BookmarkIcon, CheckCircleIcon, EyeOffIcon, PencilIcon, TrashIcon
} from '@heroicons/react/outline'

type Props = {
  projectId: string
  docId: string
}

export default () => {
  return (
    <ContextMenuWithData id="doc-menu">
      {({ projectId, docId }: Props) => (
        <>
          <ContextMenuItem
            onClick={() =>
              modalStore.renameFileModal.set({
                project: projectStore.currentProject.get()!,
                file: fileStore.idToFile.get()[docId],
              })
            }
          >
            <PencilIcon class="h-4 w-4 mr-2 text-gray-500" />
            Rename Document
          </ContextMenuItem>

          <hr />
          <ContextMenuItem
            onClick={() =>
              modalStore.deleteFileModal.set({
                project: projectStore.currentProject.get()!,
                file: fileStore.idToFile.get()[docId],
              })
            }
          >
            <TrashIcon class="h-4 w-4 mr-2 text-red-500" />
            Delete Document
          </ContextMenuItem>
        </>
      )}
    </ContextMenuWithData>
  )
}
