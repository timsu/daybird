import { TaskItem } from '@/components/editor/TaskItem'
import { Task } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'

const paragraph = (text?: string) => ({
  type: 'paragraph',
  content: text
    ? [
        {
          type: 'text',
          text,
        },
      ]
    : undefined,
})

export default async function doOnboarding(): Promise<void> {
  // create today doc
  const editor = window.editor
  if (!editor) {
    setTimeout(doOnboarding, 100)
    return
  }

  editor
    .chain()
    .setContent([
      paragraph('Welcome!'),
      paragraph(),
      paragraph(
        "This is your daily notepad - a new page for each day. Use it to plan out what's important, take notes throughout the day, and keep yourself on track."
      ),
      paragraph(),
      paragraph(
        'You can create additional notes in the sidebar and see a calendar view of your day by connecting with Google Calendar.'
      ),
      paragraph(),
      paragraph(
        'Type / at the beginning of a line to open a menu where you can create tasks and insert various types of text. Try it out!'
      ),
      paragraph(),
      paragraph(),
    ])
    .focus()
    .run()

  const task =
    taskStore.taskList.get()[0] || (await taskStore.createTask({ title: 'Create your first task' }))
  editor.commands.insertContent([{ type: 'task', attrs: { id: task.id } }, paragraph()])

  TaskItem.options.postCreateTask = onCreateTask

  const project = projectStore.currentProject.get()!
  const files = fileStore.getFilesFor(project)
  // pwaSupported && {
  //   type: 'video',
  //   attrs: {
  //     src: install_daybird,
  //   },
  // },
}

function onCreateTask(task: Task) {
  TaskItem.options.postCreateTask = undefined

  window.editor?.commands.insertContent([
    paragraph(),
    paragraph(
      `Fantastic! Try clicking on the ${task.short_code} and set a date so it shows up on tomorrow's page.`
    ),
    paragraph(),
    paragraph('Happy journaling!'),
    paragraph(),
    paragraph(),
  ])
}
