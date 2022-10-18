import { ContextMenuItem, ContextMenuWithData } from '@/components/core/ContextMenu'
import { paths } from '@/config'
import { Task, TaskState, TaskType } from '@/models'
import { modalStore } from '@/stores/modalStore'
import { taskStore } from '@/stores/taskStore'
import {
    ArchiveIcon, ArrowCircleLeftIcon, ArrowCircleRightIcon, BookmarkIcon, CheckCircleIcon,
    EyeOffIcon, TrashIcon
} from '@heroicons/react/outline'

export default () => {
  const isDoc = location.pathname.startsWith(paths.DOC) || location.pathname.startsWith(paths.TODAY)

  return (
    <ContextMenuWithData id="task-menu">
      {(task: Task) =>
        task.deleted_at ? (
          <>
            {isDoc && (
              <ContextMenuItem onClick={() => taskStore.deletedTask.set(task)}>
                <EyeOffIcon class="h-4 w-4 mr-2 text-gray-500" />
                Remove from page
              </ContextMenuItem>
            )}

            <ContextMenuItem onClick={() => taskStore.undeleteTask(task)}>
              <TrashIcon class="h-4 w-4 mr-2 text-red-500" />
              Un-delete Task
            </ContextMenuItem>
          </>
        ) : (
          <>
            {task.state ? (
              <ContextMenuItem onClick={() => taskStore.saveTask(task, { state: null })}>
                <ArrowCircleLeftIcon class="h-4 w-4 mr-2 text-blue-500" />
                Not in progress
              </ContextMenuItem>
            ) : (
              <ContextMenuItem
                onClick={() => taskStore.saveTask(task, { state: TaskState.IN_PROGRESS })}
              >
                <ArrowCircleRightIcon class="h-4 w-4 mr-2 text-blue-500" />
                Mark In Progress
              </ContextMenuItem>
            )}

            <hr />

            {isDoc && (
              <ContextMenuItem onClick={() => taskStore.deletedTask.set(task)}>
                <EyeOffIcon class="h-4 w-4 mr-2 text-gray-500" />
                Remove from page
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
        )
      }
    </ContextMenuWithData>
  )
}
