import { format, isAfter, isSameYear } from 'date-fns'
import { useEffect, useRef, useState } from 'preact/hooks'

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
  focus?: boolean
  initialTitle?: string
  taskList?: boolean
  currentDoc?: string
  newTaskMode?: boolean
  onCreate?: (task: Task | null) => void
}

export default ({
  id,
  initialTitle,
  focus,
  currentDoc,
  newTaskMode,
  taskList,
  onCreate,
}: Props) => {
  const [savedId, setSavedId] = useState<string>()
  const [showPlaceholder, setPlaceholder] = useState<boolean>(!id && !initialTitle)

  id = id || savedId
  const task = useStore(taskStore.taskMap)[id!]
  const titleRef = useRef<HTMLDivElement | null>(null)

  // --- saving and loading

  useEffect(() => {
    const div = titleRef.current
    if (!div) return

    div.addEventListener('input', (e) => {
      e.stopPropagation()
      setPlaceholder(!titleRef.current?.innerText)
    })

    div.addEventListener('keydown', (e) => e.stopPropagation())
    div.addEventListener('keypress', (e) => {
      e.stopPropagation()
      if (!newTaskMode && e.key == 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const pos = window.editor?.view.posAtDOM(e.target as Node, 0, 1)
        if (pos) {
          window.editor
            ?.chain()
            .setTextSelection(pos + 1)
            .createParagraphNear()
            .focus()
            .run()
        }
      }
    })
  }, [])

  useEffect(() => {
    // handle focus out -> task saving
    const div = titleRef.current
    if (!div) return
    const onFocusOut = async (e: Event) => {
      const title = titleRef.current?.innerText?.trim()
      const task = taskStore.taskMap.get()[id!]

      const dirty = title != task?.title
      if (!dirty || !title) return onCreate?.(task)

      if (!task) {
        const doc = docStore.doc.get()?.id
        div.innerText = '' // need to clear div text so it gets re-populated when id comes in
        const newTask = await taskStore.createTask({ title, doc })
        onCreate?.(newTask)
        setSavedId(newTask.id)
        return newTask
      } else {
        const doc = task.doc ? undefined : docStore.doc.get()?.id
        await taskStore.saveTask(task, { title, doc })
        return task
      }
    }

    div.addEventListener('focusout', onFocusOut)
    if (newTaskMode)
      div.addEventListener('keypress', async (e) => {
        if (e.key == 'Enter' && !e.shiftKey) {
          e.preventDefault()
          debounce(
            'new-task',
            async () => {
              const task = await onFocusOut(e)
              if (!task) return
              setSavedId(undefined)
              setPlaceholder(true)
            },
            500,
            DebounceStyle.IMMEDIATE_THEN_WAIT
          )
        }
      })
    if (focus && !id) {
      setTimeout(() => div.focus(), 0)
    }
    return () => div.removeEventListener('focusout', onFocusOut)
  }, [id, focus])

  useEffect(() => {
    if (id && id != 'undefined' && id != 'null') taskStore.loadTask(id)
  }, [id])

  // --- actions

  const toggleComplete = () => {
    if (!task) return
    taskStore.saveTask(task, {
      completed_at: task.completed_at ? null : new Date().toISOString(),
      state: null,
    })
  }

  const clickShortCode = (e: MouseEvent) => {
    const target = e.target as HTMLDivElement
    const rect = target.getBoundingClientRect()
    triggerContextMenu(rect.right - 240, rect.top, 'task-menu', task)
    e.preventDefault()
  }

  // --- task deletion handling

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key == 'Backspace') {
      const title = titleRef.current?.innerText?.trim()
      if (title == '') {
        // user pressed backspace on an empty task, let's delete it.
        if (!task) {
          id = 'delete-me'
          titleRef.current!.id = 'task-delete-me'
          taskStore.deletedTask.set({ id } as Task)
        } else {
          taskStore.deleteTask(task)
        }
      }
    }
  }

  const docName = task?.doc && fileStore.idToFile.get()[task.doc]?.name
  const showGoToDoc = docName && task.doc != currentDoc && !isDailyFile(docName)
  const goToDoc = () => {
    fileStore.openDoc(task.doc!)
  }

  return (
    <NodeViewWrapper
      id={task ? `task-${task.id}` : ''}
      onContextMenu={clickShortCode}
      className={classNames(
        'rounded-md -mt-[1px] p-2 flex flex-row items-center relative group',
        taskList ? '' : 'border border-transparent hover:border-gray-200 -ml-4'
      )}
    >
      {!taskList && !isSafari && !newTaskMode && (
        <span data-drag-handle="" class="-ml-2 drag-handle grippy invisible group-hover:visible" />
      )}

      {task?.deleted_at ? (
        <div class="font-semibold text-sm text-gray-500 mr-2 ">DELETED</div>
      ) : task?.archived_at ? (
        <div class="font-semibold text-sm text-gray-500 mr-2 ">ARCHIVED</div>
      ) : (
        <input
          checked={!!task?.completed_at}
          type="checkbox"
          class="mr-2 rounded border-gray-400 cursor-pointer"
          onClick={toggleComplete}
        />
      )}

      {!task?.title && showPlaceholder && (
        <div class="absolute left-[2.6em] pointer-events-none text-gray-400">New task</div>
      )}

      <div
        contentEditable
        ref={titleRef}
        onKeyDown={onKeyDown}
        onPaste={(e) => e.stopPropagation()}
        class={classNames(
          'task-title',
          'flex-grow p-1',
          task?.completed_at ? 'line-through text-gray-500' : ''
        )}
        placeholder="New task"
      >
        {task?.title || initialTitle}
      </div>

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

      <div
        class="text-sm font-semibold text-slate-500 ml-3 whitespace-nowrap cursor-pointer"
        onClick={clickShortCode}
      >
        {task?.short_code}
      </div>
    </NodeViewWrapper>
  )
}
