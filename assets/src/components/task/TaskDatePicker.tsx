import { render } from 'preact'
import tippy from 'tippy.js'

import CalendarWidget from '@/components/core/CalendarWidget'
import { Task } from '@/models'
import { taskStore } from '@/stores/taskStore'

const TaskDatePicker = ({ task, onSelected }: { task: Task; onSelected?: () => void }) => {
  const onSelect = (date: Date) => {
    taskStore.saveTask(task, { due_at: date.toISOString() })
    onSelected?.()
  }

  return (
    <div class="bg-white shadow p-2 rounded-md">
      <CalendarWidget
        currentDate={task.due_at ? new Date(task.due_at) : undefined}
        onSelect={onSelect}
      />
    </div>
  )
}

export default TaskDatePicker

export const showTaskDatePicker = (task: Task, e: MouseEvent) => {
  const container = document.createElement('div')
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  rect.x = e.clientX
  rect.y = e.clientY

  const t = tippy('body', {
    getReferenceClientRect: () => rect,
    appendTo: () => document.body,
    content: container,
    showOnCreate: true,
    interactive: true,
    trigger: 'manual',
    placement: 'left',
  })

  render(<TaskDatePicker task={task} onSelected={() => t[0].destroy()} />, container)
}
