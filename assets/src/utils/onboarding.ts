import install_daybird from '@/images/install_daybird.mp4'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { isChrome } from '@/utils/os'

export default async function doOnboarding(): Promise<void> {
  // create today doc
  const editor = window.editor
  if (!editor) {
    setTimeout(doOnboarding, 5000)
    return
  }

  const task =
    taskStore.taskList.get()[0] || (await taskStore.createTask({ title: 'Create your first task' }))

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
        'You can create additional notes on the 👈 left and see a calendar view of your day on the 👉 right. (On mobile, use the buttons in the header).'
      ),
      paragraph(),
      paragraph(
        'Type / at the beginning of a line to open a menu where you can create tasks and insert various types of text. Try it out!'
      ),
      paragraph(),
      { type: 'task', attrs: { id: task.id } },
      paragraph(),
      paragraph(
        'Tasks are more than meet the eye - click on the ' +
          task.short_code +
          " to see extra options. Try giving your task a date so it shows up on tomorrow's page."
      ),
      paragraph(),
      paragraph('Happy journaling!'),
    ])
    .focus()
    .run()

  editor.commands.insertContent(paragraph()) // insert content to trigger a save

  const project = projectStore.currentProject.get()!
  const files = fileStore.getFilesFor(project)
  // pwaSupported && {
  //   type: 'video',
  //   attrs: {
  //     src: install_daybird,
  //   },
  // },
}
