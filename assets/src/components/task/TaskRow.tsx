import { route } from 'preact-router'
import { useEffect, useRef, useState } from 'preact/hooks'

import { triggerContextMenu } from '@/components/core/ContextMenu'
import { paths } from '@/config'
import { Task } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { classNames, logger } from '@/utils'
import { isSafari } from '@/utils/os'
import { DocumentIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  id: string | undefined
  focus?: boolean
  initialTitle?: string
  taskList?: boolean
  showContext?: boolean
  newTaskMode?: boolean
  onCreate?: (task: Task) => void
}

export default ({
  id,
  initialTitle,
  focus,
  showContext,
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
      if (!dirty || !title) return

      if (!task) {
        const doc = docStore.id.get()
        const newTask = await taskStore.createTask({ title, doc })
        onCreate?.(newTask)
        div.innerText = '' // need to clear div text so it gets re-populated when id comes in
        setSavedId(newTask.id)
        return newTask
      } else {
        const doc = task.doc ? undefined : docStore.id.get()
        await taskStore.saveTask(task, { title, doc })
        return task
      }
    }

    div.addEventListener('focusout', onFocusOut)
    if (newTaskMode)
      div.addEventListener('keypress', async (e) => {
        if (e.key == 'Enter' && !e.shiftKey) {
          e.preventDefault()
          const task = await onFocusOut(e)
          if (!task) return
          setSavedId(undefined)
          setPlaceholder(true)
          taskStore.taskList.set([task, ...taskStore.taskList.get()])
        }
      })
    if (focus && !id) {
      requestAnimationFrame(() => div.focus())
    }
    return () => div.removeEventListener('focusout', onFocusOut)
  }, [id, focus])

  useEffect(() => {
    if (id && id != 'undefined' && id != 'null') taskStore.loadTask(id)
  }, [id])

  // --- actions

  const toggleComplete = () => {
    taskStore.saveTask(task, { completed_at: task.completed_at ? null : new Date().toISOString() })
  }

  const clickShortCode = (e: MouseEvent) => {
    const target = e.target as HTMLDivElement
    const rect = target.getBoundingClientRect()
    triggerContextMenu(rect.right - 240, rect.top, 'task-menu', task)
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

  const goToDoc = () => {
    const currentProject = projectStore.currentProject.get()
    route(`${paths.DOC}/${currentProject!.id}/${task.doc}`)
  }

  return (
    <div
      id={task ? `task-${task.id}` : ''}
      className={classNames(
        'rounded-md -mt-[1px] p-2 flex flex-row items-center relative hover-parent',
        taskList ? '' : 'border border-transparent hover:border-gray-200 -ml-4'
      )}
    >
      {!taskList && !isSafari && <span class="-ml-2 drag-handle grippy hover-visible" />}

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

      {showContext && task?.doc && (
        <div
          class="flex items-center text-sm text-blue-500 hover:bg-blue-200/75 rounded
              ml-3 max-w-[110px] overflow-ellipsis cursor-pointer"
          onClick={goToDoc}
        >
          <DocumentIcon class="w-4 h-4 mr-1" />
          {fileStore.idToFile.get()[task.doc]?.name}
        </div>
      )}

      <div
        class="text-sm font-semibold text-slate-500 ml-3 whitespace-nowrap cursor-pointer"
        onClick={clickShortCode}
      >
        {task?.short_code}
      </div>
    </div>
  )
}
