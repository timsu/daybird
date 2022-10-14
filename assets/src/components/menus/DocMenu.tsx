import copy from 'copy-to-clipboard'

import { ContextMenuItem, ContextMenuWithData } from '@/components/core/ContextMenu'
import { paths } from '@/config'
import { Project, Task, TaskType } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import {
    ArchiveIcon, BookmarkIcon, CheckCircleIcon, CheckIcon, EyeOffIcon, LinkIcon, PencilIcon,
    PrinterIcon, TrashIcon
} from '@heroicons/react/outline'

type Props = {
  projectId: string
  docId: string
  dailyNote?: boolean
}

export default () => {
  return (
    <ContextMenuWithData id="doc-menu">
      {({ dailyNote, docId }: Props) => (
        <>
          {!dailyNote && (
            <ContextMenuItem onClick={() => copy(location.href)}>
              <LinkIcon class="h-4 w-4 mr-2" />
              Copy File Link
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => print()}>
            <PrinterIcon class="h-4 w-4 mr-2" />
            Print Document
          </ContextMenuItem>
          <ContextMenuItem onClick={() => docStore.removeCompletedTasks()}>
            <CheckIcon class="h-4 w-4 mr-2 text-gray-500" />
            Remove Completed Tasks
          </ContextMenuItem>
          {!dailyNote && (
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
          )}

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
            {dailyNote ? 'Clear' : 'Delete'} Document
          </ContextMenuItem>
        </>
      )}
    </ContextMenuWithData>
  )
}
