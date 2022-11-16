import { CommandItem } from '@/components/slashmenu/SlashExtension'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { Editor } from '@tiptap/core'

export default ({ query, editor }: { query: string; editor: Editor }) => {
  let items: CommandItem[] = [
    {
      title: 'New Task',
      shortcut: '[]',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    } as CommandItem,
    {
      title: 'Existing Task',
      shortcut: '//',
      command: ({ editor, range }) => {
        const currentProject = projectStore.currentProject.get()
        taskStore
          .loadTasks(currentProject!)
          .then(() => editor.chain().focus().deleteRange(range).insertContent('//').run())
      },
    } as CommandItem,
    {
      title: 'Heading 1',
      shortcut: '#',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    } as CommandItem,
    {
      title: 'Heading 2',
      shortcut: '##',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    } as CommandItem,
    {
      title: 'Bullet List',
      shortcut: '-',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    } as CommandItem,
    {
      title: 'Numbered List',
      shortcut: '1.',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    } as CommandItem,
    {
      title: 'Quote',
      shortcut: '>',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    } as CommandItem,
    {
      title: 'Divider',
      shortcut: '---',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    } as CommandItem,
    {
      title: 'Code',
      shortcut: '```',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    } as CommandItem,
  ]

  if (query) {
    items = items
      .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10)
  }

  return items
}
