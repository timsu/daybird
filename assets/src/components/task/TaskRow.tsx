import { useEffect, useState } from 'preact/hooks'

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

  console.log('rendering task', task)
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (id) taskStore.loadTask(id)
  }, [id])

  const onSubmit = async (e: Event) => {
    e.preventDefault()

    const dirty = title != task?.title
    if (!dirty) return

    if (!task) {
      const newTask = await taskStore.createTask({ title })
      onCreate?.(newTask)
    } else {
      console.log('todo save')
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div contentEditable={false} class="bg-gray-100 rounded p-4 flex flex-row items-center">
        <input type="checkbox" class="mr-2 rounded border-gray-400" />

        <input
          type="text"
          class="text-lg rounded px-1 py-0 bg-transparent border-none flex-grow"
          value={title || task?.title || ''}
          placeholder="What would you like to do?"
          onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
          onBlur={onSubmit}
          ref={(elem) => focus && setTimeout(() => elem?.focus(), 100)}
        />
      </div>
    </form>
  )
}
