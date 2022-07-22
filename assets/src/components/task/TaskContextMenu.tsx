import { ContextMenuItem, ContextMenuWithData } from '@/components/core/ContextMenu'
import { Task, TaskType } from '@/models'
import { modalStore } from '@/stores/modalStore'
import { taskStore } from '@/stores/taskStore'
import { ArchiveIcon, BookmarkIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/outline'

export default () => (
  <ContextMenuWithData id="task-menu">
    {(task: Task) => (
      <>
        {task.type == TaskType.TASK && (
          <ContextMenuItem onClick={() => taskStore.saveTask(task, { type: TaskType.STORY })}>
            <BookmarkIcon class="h-4 w-4 mr-2 text-green-500" />
            Convert to Story
          </ContextMenuItem>
        )}

        {task.type == TaskType.STORY && (
          <ContextMenuItem onClick={() => taskStore.saveTask(task, { type: TaskType.TASK })}>
            <CheckCircleIcon class="h-4 w-4 mr-2 text-blue-500" />
            Convert to Task
          </ContextMenuItem>
        )}

        <ContextMenuItem onClick={() => taskStore.toggleArchived(task)}>
          <ArchiveIcon class="h-4 w-4 mr-2 text-gray-500" />
          {task.archived_at ? 'Unarchive Task' : 'Archive Task'}
        </ContextMenuItem>
        <div class="text-xs text-gray-600 p-2 pt-0">
          Archived tasks remain on the page but disappear from active task lists.
        </div>
        <hr />
        <ContextMenuItem onClick={() => modalStore.deleteTaskModal.set(task)}>
          <TrashIcon class="h-4 w-4 mr-2 text-red-500" />
          Delete Task
        </ContextMenuItem>
      </>
    )}
  </ContextMenuWithData>
)
