import { useEffect, useRef, useState } from 'preact/hooks'

import { Task } from '@/models'
import { taskStore } from '@/stores/taskStore'
import { useStore } from '@nanostores/preact'

type Props = {
  id: string
  focus?: boolean
  onCreate?: (task: Task) => void
}

export default ({ id, focus, onCreate }: Props) => {
  const task = useStore(taskStore.taskMap)[id]
  const titleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const div = titleRef.current
    if (!div) return
    div.addEventListener('input', (e) => e.stopPropagation())
    div.addEventListener('keydown', (e) => e.stopPropagation())
    div.addEventListener('keypress', (e) => {
      e.stopPropagation()
      if (e.key == 'Enter') {
        e.preventDefault()
        div.parentElement!.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
        )
      }
    })
  }, [])

  useEffect(() => {
    const div = titleRef.current
    if (!div) return
    const onFocusOut = async (e: Event) => {
      const title = titleRef.current?.innerText
      const task = taskStore.taskMap.get()[id]

      const dirty = title != task?.title
      if (!dirty) return

      if (!task) {
        const newTask = await taskStore.createTask({ title })
        onCreate?.(newTask)
      } else {
        await taskStore.saveTask(task, { title })
      }
    }

    div.addEventListener('focusout', onFocusOut)
    if (focus) div.focus()
    return () => div.removeEventListener('focusout', onFocusOut)
  }, [id, focus])

  useEffect(() => {
    if (id) taskStore.loadTask(id)
  }, [id])

  return (
    <div contentEditable={false} class="bg-gray-100 rounded p-2 flex flex-row items-center">
      <input type="checkbox" class="mr-2 rounded border-gray-400" />

      <div contentEditable ref={titleRef} class="flex-grow p-1">
        {task?.title}
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
