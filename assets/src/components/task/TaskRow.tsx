import { format, isAfter, isSameYear } from 'date-fns'
import { MutableRef, useEffect, useRef, useState } from 'preact/hooks'

import { triggerContextMenu } from '@/components/core/ContextMenu'
import { showTaskDatePicker } from '@/components/task/TaskDatePicker'
import { paths } from '@/config'
import { Task } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore, isDailyFile } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { classNames, debounce, DebounceStyle, logger } from '@/utils'
import { isSafari } from '@/utils/os'
import { DocumentIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'
import { NodeViewWrapper } from '@tiptap/react'

type Props = {
  id: string | undefined
  contentRef?: MutableRef<HTMLDivElement | null>
  taskList?: boolean
  currentDoc?: string
  newTaskMode?: boolean
  onCreate?: (task: Task | null) => void
}

export default function (props: Props) {
  const { id, contentRef, onCreate } = props
  const task = useStore(taskStore.taskMap)[id!]

  return (
    <>
      <TaskCheckbox task={task} />
      <TaskContent task={task} {...props} />
      <TaskActions task={task} />
    </>
  )
}

function TaskCheckbox({ task }: { task: Task }) {
  const toggleComplete = () => {
    if (!task) return
    taskStore.saveTask(task, {
      completed_at: task.completed_at ? null : new Date().toISOString(),
      state: null,
    })
  }

  return (
    <label class="mr-1 select-none">
      {task?.deleted_at ? (
        <div class="font-semibold text-sm text-gray-500 mr-2 ">DELETED</div>
      ) : task?.archived_at ? (
        <div class="font-semibold text-sm text-gray-500 mr-2 ">ARCHIVED</div>
      ) : (
        <input
          checked={!!task?.completed_at}
          type="checkbox"
          class="rounded border-gray-400 cursor-pointer"
          onClick={toggleComplete}
        />
      )}
    </label>
  )
}

function TaskContent({ id, task, contentRef, onCreate, currentDoc }: { task: Task } & Props) {
  const ref = contentRef || useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const div = ref.current
    if (!div) return

    if (task && div.textContent != task.title) {
      div.innerText = task.title
    }

    const onFocusOut = async () => {
      const title = div.textContent?.trim()
      if (!task && !id && title) {
        // task creation mode
        const newTask = await taskStore.createTask({ title, doc: currentDoc })
        onCreate?.(newTask)
      } else if (task && title != task.title) {
        // task editing mode
        await taskStore.saveTask(task, { title })
      }
    }

    div.addEventListener('focusout', onFocusOut)
    return () => div.removeEventListener('focusout', onFocusOut)
  }, [ref.current, task])

  return <div contentEditable class="flex-1 px-1" ref={ref} />
}

function TaskActions({ task }: { task: Task }) {
  return (
    <>
      {task?.state && <div class="font-semibold text-sm text-blue-500 ml-2">IN PROGRESS</div>}

      {task?.due_at && (
        <div
          class={
            'font-semibold text-sm ml-2 cursor-pointer ' +
            (isAfter(new Date(task.due_at), new Date()) ? 'text-green-500' : 'text-red-500')
          }
          onClick={(e) => showTaskDatePicker(task, e)}
        >
          {Task.renderDueDate(task)}
        </div>
      )}

      {task?.priority ? (
        <div
          class={classNames(
            'font-semibold text-sm ml-2',
            ['text-gray-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'][task.priority]
          )}
        >
          {'!'.repeat(task.priority)}
        </div>
      ) : null}
    </>
  )
}
