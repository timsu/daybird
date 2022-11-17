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
        'You can create additional notes from the left sidebar and see a calendar view of your day by connecting with Google Calendar.'
      ),
      paragraph(),
      paragraph(
        'Type "[] " at the beginning of a line create a task, or "/" to open a menu. Try it out!'
      ),
      paragraph(),
      paragraph(),
    ])
    .focus()
    .run()

  taskStore.showOnboardingForNextTask = true
}
