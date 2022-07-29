import { useEffect, useRef, useState } from 'preact/hooks'
import Quill from 'quill'

import { triggerContextMenu } from '@/components/core/ContextMenu'
import Tooltip from '@/components/core/Tooltip'
import { paths } from '@/config'
import { Task } from '@/models'
import { docStore } from '@/stores/docStore'
import { DOC_EXT, fileStore, getNameFromPath } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { taskStore } from '@/stores/taskStore'
import { classNames } from '@/utils'
import { DocumentIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  id: string | undefined
  focus?: boolean
  initialTitle?: string
  showContextProjectId?: string
  newTaskMode?: boolean
  onCreate?: (task: Task) => void
}

const getQuillIndex = (e: Event) => {
  const blot = Quill.find(e.target as HTMLDivElement, true)
  return blot.offset(window.quill?.scroll)
}

export default ({
  id,
  initialTitle,
  focus,
  showContextProjectId,
  newTaskMode,
  onCreate,
}: Props) => {
  const [savedId, setSavedId] = useState<string>()
  const [showPlaceholder, setPlaceholder] = useState<boolean>(!id && !initialTitle)

  id = id || savedId
  const task = useStore(taskStore.taskMap)[id!]
  const titleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const div = titleRef.current
    if (!div) return

    // prevent navigation propagating to Quill when focused on this element
    div.addEventListener('input', (e) => {
      e.stopPropagation()
      setPlaceholder(!titleRef.current?.innerText)
    })
    div.addEventListener('keydown', (e) => e.stopPropagation())
    div.addEventListener('keypress', (e) => {
      e.stopPropagation()
      if (!newTaskMode && e.key == 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const isBeginning = window.getSelection()?.anchorOffset == 0
        const index = getQuillIndex(e)
        if (isBeginning) {
          window.quill?.insertText(index, '\n')
        } else {
          // if we're at the end of the doc, insert a newline
          // if (index + 2 >= window.quill!.getLength()) {
          //   window.quill?.insertText(index + 1, '\n')
          // } else {
          window.quill?.setSelection(index + 1)
          //}
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
        const doc = docStore.filename.get()
        const newTask = await taskStore.createTask({ title, doc })
        onCreate?.(newTask)
        div.innerText = '' // need to clear div text so it gets re-populated when id comes in
        setSavedId(newTask.id)
        return newTask
      } else {
        const doc = task.doc ? undefined : docStore.filename.get()
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
    if (focus && !id) div.focus()
    return () => div.removeEventListener('focusout', onFocusOut)
  }, [id, focus])

  useEffect(() => {
    if (id && id != 'undefined' && id != 'null') taskStore.loadTask(id)
  }, [id])

  const toggleComplete = () => {
    taskStore.saveTask(task, { completed_at: task.completed_at ? null : new Date().toISOString() })
  }

  const clickShortCode = (e: MouseEvent) => {
    const target = e.target as HTMLDivElement
    const rect = target.getBoundingClientRect()
    triggerContextMenu(rect.right - 240, rect.top, 'task-menu', task)
  }

  const onKeyDownRow = (e: KeyboardEvent) => {
    if (e.key == 'Backspace') {
      if (!task) {
        id = 'delete-me'
        titleRef.current!.id = 'task-delete-me'
        taskStore.deletedTask.set({ id } as Task)
      } else if (showContextProjectId) {
        titleRef.current!.id = 'task-delete-me'
        taskStore.deletedTask.set({ id: 'delete-me' } as Task)
      } else {
        modalStore.deleteTaskModal.set(task)
      }
    } else if (e.key == 'ArrowUp' || e.key == 'ArrowLeft') {
      // these offsets are wrong by one, but i can't seem to get quill to select the right thing
      const index = getQuillIndex(e)
      window.quill?.setSelection(index, 0)
    } else if (e.key == 'ArrowDown' || e.key == 'ArrowRight') {
      const index = getQuillIndex(e)
      window.quill?.setSelection(index + 0.5, 0)
    }
  }

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

  return (
    <div
      id={task ? `task-${task.id}` : ''}
      contentEditable={false}
      class="bg-gray-100 rounded p-2 flex flex-row items-center relative"
      tabIndex={0}
      onKeyDown={onKeyDownRow}
    >
      {task?.archived_at ? (
        <div class="font-semibold text-sm text-gray-500 mr-2 ">ARCHIVED</div>
      ) : (
        <input
          checked={!!task?.completed_at}
          type="checkbox"
          class="mr-2 rounded border-gray-400"
          onClick={toggleComplete}
        />
      )}

      {!task?.title && showPlaceholder && (
        <div class="absolute left-[2.2em] pointer-events-none text-gray-400">New task</div>
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

      {showContextProjectId && task?.doc && (
        <a href={`${paths.DOC}/${showContextProjectId}/${task.doc}`}>
          <div
            class="flex items-center text-sm text-blue-500 hover:bg-blue-200/75 rounded
              ml-3 max-w-[100px] overflow-ellipsis"
          >
            <DocumentIcon class="w-4 h-4 mr-1" />
            {getNameFromPath(task.doc)}
          </div>
        </a>
      )}

      <div
        class="text-sm font-semibold text-slate-500 ml-3 whitespace-nowrap cursor-pointer"
        onClick={clickShortCode}
      >
        {task?.short_code}
      </div>

      {/* <input
          type="text"
          class="text-lg rounded px-1 py-0 bg-transparent border-none flex-grow"
          value={title || task?.title || ''}
          placeholder="What would you like to do?"
          onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
          onBlur={onSubmit}
          ref={(elem) => focus && setTimeout(() => elem?.focus(), 100)}
        /> */}
    </div>
  )
}
