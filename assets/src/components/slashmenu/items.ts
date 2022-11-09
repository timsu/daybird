import { CommandItem } from '@/components/slashmenu/CommandsList'
import { Editor } from '@tiptap/core'

const getSuggestionItems = ({ query, editor }: { query: string; editor: Editor }) => {
  const items: CommandItem[] = [
    {
      title: 'H1',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    } as CommandItem,
    {
      title: 'H2',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    } as CommandItem,
    {
      title: 'bold',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setMark('bold').run()
      },
    } as CommandItem,
    {
      title: 'italic',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setMark('italic').run()
      },
    } as CommandItem,
    {
      title: 'image',
      command: ({ editor, range }) => {
        console.log('call some function from parent')
        editor.chain().focus().deleteRange(range).setNode('paragraph').run()
      },
    } as CommandItem,
  ]
    .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 10)

  return items
}

export default getSuggestionItems
