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

  const pwaSupported = isChrome

  editor
    .chain()
    .setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text:
              'Welcome!\n\n' +
              "This is your daily notepad - a new page for each day. Use it to plan out what's important, take notes throughout the day, and keep yourself on track.\n\n" +
              'You can create additional notes on the 👈 left and see a calendar view of your day on the 👉 right. (On mobile, use the buttons in the header).\n\n' +
              'Type / at the beginning of a line to open a menu where you can create tasks and insert various types of text. Try it out!\n',
          },
        ],
      },
      { type: 'task', attrs: { id: task.id } },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text:
              '\nTasks are more than meet the eye - click on the ' +
              task.short_code +
              " to see extra options. Try giving your task a date so it shows up on tomorrow's page.\n\n" +
              'Happy journaling!\n',
          },
        ],
      },
      // pwaSupported && {
      //   type: 'video',
      //   attrs: {
      //     src: install_daybird,
      //   },
      // },
    ])
    .focus()
    .run()

  const project = projectStore.currentProject.get()!
  const files = fileStore.getFilesFor(project)
}
