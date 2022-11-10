import { PluginKey } from 'prosemirror-state'

import renderItems from '@/components/slashmenu/renderItems'
import SlashMenu from '@/components/slashmenu/SlashMenu'
import { Editor, Extension, Range } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'

export type CommandItem = {
  title: string
  shortcut?: string
  command: (args: { editor: Editor; range: Range }) => void
}

type ExtensionOptions = {
  suggestion: Partial<SuggestionOptions<CommandItem>>
}

const pluginKey = new PluginKey('existingtasks')

const ExistingTasksExtension = Extension.create<ExtensionOptions>({
  name: 'existingtasks',

  addOptions() {
    return {
      ...this.parent?.(),
      suggestion: {
        char: '//',
        startOfLine: true,
        items: ({ query, editor }: { query: string; editor: Editor }) => {
          let items: CommandItem[] = [
            {
              title: 'Existing Tasks baby',
              shortcut: '[]',
              command: ({ editor, range }) => {
                const newNode = {
                  type: 'task',
                  attrs: { id: 'focus' },
                }
                editor.chain().focus().deleteRange(range).insertContent(newNode).run()
              },
            } as CommandItem,
          ]
          return items
        },
        render: renderItems(SlashMenu),
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey,
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export default ExistingTasksExtension
