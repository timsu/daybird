import { CommandItem } from '@/components/slashmenu/commands'
import { Editor } from '@tiptap/core'

export default ({ query, editor }: { query: string; editor: Editor }) => {
  const items: CommandItem[] = [
    {
      title: 'New Task',
      shortcut: '[]',
      command: ({ editor, range }) => {
        const newNode = {
          type: 'task',
          attrs: { id: 'focus' },
        }
        editor.chain().focus().deleteRange(range).insertContent(newNode).run()
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
    .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 10)

  return items
}
