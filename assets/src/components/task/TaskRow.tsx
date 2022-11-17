import { isAfter } from 'date-fns'
import { createRef, render, RenderableProps } from 'preact'
import { MutableRef, useEffect, useRef } from 'preact/hooks'
import { twMerge } from 'tailwind-merge'
import tippy from 'tippy.js'

import { triggerContextMenu } from '@/components/core/ContextMenu'
import { showTaskDatePicker } from '@/components/task/TaskDatePicker'
import { Task } from '@/models'
import { fileStore, isDailyFile } from '@/stores/fileStore'
import { taskStore } from '@/stores/taskStore'
import { classNames } from '@/utils'
import { CalendarIcon, DocumentIcon, DotsHorizontalIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

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

  useEffect(() => {
    if (id && id != 'undefined' && id != 'null') taskStore.loadTask(id)
  }, [id])

  return (
    <>
      <TaskCheckbox task={task} />
      {taskList ? (
        <TaskContentInList task={task} {...props} />
      ) : (
        <TaskContentInDoc task={task} {...props} />
      )}
      <TaskActions task={task} {...props} />
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

  const disabled = !!task?.deleted_at || !!task?.archived_at

  return (
    <label contentEditable={false} class="mr-1 select-none">
      <input
        checked={!!task?.completed_at}
        type="checkbox"
        class={classNames(
          'rounded border-gray-400 cursor-pointer -mt-1',
          disabled ? 'bg-gray-300' : ''
        )}
        onClick={toggleComplete}
        disabled={disabled}
        title={task?.deleted_at ? 'Deleted' : task?.archived_at ? 'Archived' : undefined}
      />
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

    div.addEventListener('keypress', (e) => {
      e.stopPropagation()
      if (e.key == 'Enter' && !e.shiftKey) {
        e.preventDefault()
      }
    })

    div.addEventListener('focusout', onFocusOut)
    return () => div.removeEventListener('focusout', onFocusOut)
  }, [ref.current, task])

  return (
    <div class="flex-1 px-1" ref={ref} contentEditable>
      {task.title}
    </div>
  )
}

function TaskActions({ task, currentDoc, taskList }: { task: Task } & Props) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const showTaskOnboardingId = useStore(taskStore.showTaskOnboarding)
  const showTaskOnboarding = !!showTaskOnboardingId && showTaskOnboardingId == task?.id

  useEffect(() => {
    if (showTaskOnboarding) {
      const container = document.createElement('div')
      render(
        <div ref={tooltipRef} class="bg-black text-white p-2 rounded shadow text-sm w-40">
          👆 You can set a due date and other options on tasks.
        </div>,
        container
      )
      const rect = divRef.current?.getBoundingClientRect()!
      if (!rect.top) return

      tippy('body', {
        getReferenceClientRect: () => rect,
        appendTo: () => document.body,
        content: container,
        showOnCreate: true,
        trigger: 'manual',
        placement: 'bottom',
        arrow: true,
        theme: 'dark',
      })

      divRef.current?.addEventListener('click', () => taskStore.showTaskOnboarding.set(null))
    }
  }, [showTaskOnboarding])

  if (!task) return null

  const showContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLDivElement
    const rect = target.getBoundingClientRect()
    triggerContextMenu(rect.right - 240, rect.top, 'task-menu', task)
    e.preventDefault()
  }

  const nextPriority = ((task.priority || 0) + 1) % 4
  const onClickPriority = () => {
    taskStore.saveTask(task, { priority: nextPriority })
  }

  const docName = task.doc && fileStore.idToFile.get()[task.doc]?.name
  const showGoToDoc = docName && task.doc != currentDoc && !isDailyFile(docName)
  const goToDoc = () => {
    fileStore.openDoc(task.doc!)
  }

  return (
    <div class="ml-2 flex items-center" contentEditable={false} ref={divRef}>
      <div class="h-[26px]" />

      <HoverButton visible={showTaskOnboarding} onClick={showContextMenu}>
        <DotsHorizontalIcon class="w-4 h-4 opacity-50" />
      </HoverButton>

      {task?.state && <div class="font-semibold text-xs text-blue-500">IN PROGRESS</div>}

      <HoverButton
        className="w-6 whitespace-nowrap"
        visible={showTaskOnboarding || !!task.priority}
        onClick={onClickPriority}
      >
        <div
          class={classNames(
            'font-semibold text-xs',
            task.priority == 3
              ? 'text-red-500'
              : task.priority
              ? 'text-orange-400'
              : 'text-gray-500'
          )}
        >
          {'!'.repeat(task.priority || 1)}
        </div>
      </HoverButton>

      <HoverButton
        visible={showTaskOnboarding || !!task.due_at}
        onClick={(e) => showTaskDatePicker(task, e)}
      >
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

      {showGoToDoc && (
        <div
          class="flex items-center text-sm text-blue-500 hover:bg-blue-200/75 rounded
              ml-3 max-w-[110px] overflow-hidden cursor-pointer overflow-ellipsis whitespace-nowrap"
          onClick={goToDoc}
        >
          <DocumentIcon class="w-4 h-4 mr-1" />
          {fileStore.idToFile.get()[task.doc!]?.name}
        </div>
      )}
    </div>
  )
}

const HoverButton = ({
  onClick,
  visible,
  children,
  className,
}: RenderableProps<{
  visible?: boolean
  onClick: (e: MouseEvent) => void
  className?: string
}>) => {
  return (
    <button
      className={twMerge(
        'group-hover text-sm p-1 rounded cursor-pointer hover:bg-gray-200 border border-transparent hover:border-gray-300',
        visible ? '' : 'hidden opacity-0',
        className || ''
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
