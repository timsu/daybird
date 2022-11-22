import { render } from 'preact'
import tippy, { Instance } from 'tippy.js'

import CalendarWidget from '@/components/core/CalendarWidget'
import Pressable from '@/components/core/Pressable'
import { Task } from '@/models'
import { taskStore } from '@/stores/taskStore'

const TaskDatePicker = ({ task, onSelected }: { task: Task; onSelected?: () => void }) => {
  const onSelect = (date: Date | null) => {
    taskStore.saveTask(task, { due_at: date && date.toISOString() })
    onSelected?.()
  }

  return (
    <div class="bg-white shadow p-2 rounded-md">
      <CalendarWidget
        currentDate={task.due_at ? new Date(task.due_at) : undefined}
        onSelect={onSelect}
      />
      <Pressable className="text-xs" onClick={() => onSelect(null)}>
        No Date
      </Pressable>
    </div>
  )
}

export default TaskDatePicker

let prevInstance: Instance[] | undefined = undefined

export const showTaskDatePicker = (task: Task, e: MouseEvent) => {
  const container = document.createElement('div')
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  rect.x = e.clientX
  rect.y = e.clientY

  if (prevInstance) prevInstance.forEach((i) => i.destroy())

  const t = (prevInstance = tippy('body', {
    getReferenceClientRect: () => rect,
    appendTo: () => document.body,
    content: container,
    showOnCreate: true,
    interactive: true,
    trigger: 'manual',
    placement: 'right',
  }))

  render(<TaskDatePicker task={task} onSelected={() => t[0].destroy()} />, container)
}
