import { format, isAfter, isSameYear } from 'date-fns'
import { RenderableProps } from 'preact'
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
import { CalendarIcon, DocumentIcon, DotsHorizontalIcon } from '@heroicons/react/outline'
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
  const { id, taskList } = props
  const task = useStore(taskStore.taskMap)[id!]

  return (
    <>
      <TaskCheckbox task={task} />
      {taskList ? (
        <TaskContentInList task={task} {...props} />
      ) : (
        <TaskContentInDoc task={task} {...props} />
      )}
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
    <label contentEditable={false} class="mr-1 select-none">
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

function TaskContentInDoc({ id, task, contentRef, onCreate, currentDoc }: { task: Task } & Props) {
  const ref = contentRef || useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const contentElement = ref.current
    if (!contentElement) return

    if (task && contentElement.textContent != task.title) {
      contentElement.innerText = task.title
    }

    const onFocusOut = async () => {
      const title = contentElement.textContent?.trim()
      if (!task && !id && title) {
        // task creation mode
        const newTask = await taskStore.createTask({ title, doc: currentDoc })
        onCreate?.(newTask)
      } else if (task && title != task.title) {
        // task editing mode
        await taskStore.saveTask(task, { title })
      }
    }

    let hasFocus = true
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach((mutation) => {
        if (mutation.attributeName != 'class') return
        if ((mutation.target as HTMLElement).className == 'has-focus') hasFocus = true
        else if (hasFocus) {
          hasFocus = false
          onFocusOut()
        }
      })
    })

    observer.observe(contentElement, { attributes: true, subtree: true })
    return () => observer.disconnect()
  }, [task])

  return <div class="flex-1 px-1" ref={ref} />
}

function TaskContentInList({ id, task, contentRef, onCreate, currentDoc }: { task: Task } & Props) {
  const ref = contentRef || useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const div = ref.current
    if (!div) return

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

  return (
    <div class="flex-1 px-1" ref={ref}>
      {task.title}
    </div>
  )
}

function TaskActions({ task }: { task: Task }) {
  if (!task) return null

  const showContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLDivElement
    const rect = target.getBoundingClientRect()
    triggerContextMenu(rect.right - 240, rect.top, 'task-menu', task)
    e.preventDefault()
  }

  return (
    <div class="ml-2 flex items-center gap-2" contentEditable={false}>
      {task?.state && <div class="font-semibold text-sm text-blue-500 ml-2">IN PROGRESS</div>}

      <HoverButton visible={!!task.due_at} onClick={(e) => showTaskDatePicker(task, e)}>
        {task.due_at ? (
          <div
            class={
              'text-xs ' +
              (isAfter(new Date(task.due_at), new Date()) ? 'text-green-500' : 'text-red-500')
            }
          >
            {Task.renderDueDate(task)}
          </div>
        ) : (
          <CalendarIcon class="h-4 w-4 opacity-50" />
        )}
      </HoverButton>

      {task?.priority ? (
        <div
          class={classNames(
            'font-semibold text-xs ml-2',
            ['text-gray-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'][task.priority]
          )}
        >
          {'!'.repeat(task.priority)}
        </div>
      ) : null}

      <HoverButton onClick={showContextMenu}>
        <DotsHorizontalIcon class="w-4 h-4 opacity-50" />
      </HoverButton>
    </div>
  )
}

const HoverButton = ({
  onClick,
  visible,
  children,
}: RenderableProps<{ visible?: boolean; onClick: (e: MouseEvent) => void }>) => {
  return (
    <button
      class={classNames(
        'group-hover text-sm p-1 rounded cursor-pointer hover:bg-gray-200 border border-transparent hover:border-gray-300',
        visible ? '' : 'opacity-0'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
