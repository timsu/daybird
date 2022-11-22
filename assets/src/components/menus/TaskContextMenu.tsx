import { ContextMenuItem, ContextMenuWithData } from '@/components/core/ContextMenu'
import Pressable from '@/components/core/Pressable'
import { showTaskDatePicker } from '@/components/task/TaskDatePicker'
import { paths } from '@/config'
import { Task, TaskState, TaskType } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { taskStore } from '@/stores/taskStore'
import { classNames } from '@/utils'
import {
    ArchiveIcon, ArrowCircleLeftIcon, ArrowCircleRightIcon, BookmarkIcon, CalendarIcon,
    CheckCircleIcon, DocumentIcon, EyeOffIcon, FlagIcon, LinkIcon, TrashIcon, XIcon
} from '@heroicons/react/outline'

export default () => {
  const isDocPage =
    location.pathname.startsWith(paths.DOC) || location.pathname.startsWith(paths.TODAY)

  return (
    <ContextMenuWithData id="task-menu">
      {(task: Task) =>
        task.deleted_at ? (
          <>
            {isDocPage && (
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

            {!task.due_at ? (
              <ContextMenuItem onClick={(e) => showTaskDatePicker(task, e)}>
                <CalendarIcon class="h-4 w-4 mr-2 text-green-500" />
                Add Date
              </ContextMenuItem>
            ) : (
              <ContextMenuItem class="hover:bg-inherit">
                <CalendarIcon class="h-4 w-4 mr-2 text-green-500" />
                <Pressable className="flex-row" onClick={(e) => showTaskDatePicker(task, e)}>
                  Date: <span className="ml-2 text-green-500">{Task.renderDueDate(task)}</span>
                </Pressable>
                <div className="flex-1" />
                <Pressable onClick={(e) => taskStore.saveTask(task, { due_at: null })}>
                  <XIcon class="h-4 w-4" />
                </Pressable>
              </ContextMenuItem>
            )}

            <ContextMenuItem class="hover:bg-inherit">
              <FlagIcon class="h-4 w-4 mr-2 text-orange-500" />
              <div className="flex-1">Priority</div>
              {[0, 1, 2, 3].map((p) => (
                <Pressable
                  className={classNames(
                    'px-2 hover:bg-blue-400',
                    ['text-gray-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'][p]
                  )}
                  onClick={() => taskStore.saveTask(task, { priority: p })}
                  key={p}
                >
                  {p}
                </Pressable>
              ))}
            </ContextMenuItem>

            <hr />

            {task.doc && (!isDocPage || task.doc != docStore.doc.get()?.id) && (
              <ContextMenuItem onClick={() => fileStore.openDoc(task.doc)}>
                <DocumentIcon class="h-4 w-4 mr-2 text-gray-500" />
                View original note
              </ContextMenuItem>
            )}
            {isDocPage && (
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
