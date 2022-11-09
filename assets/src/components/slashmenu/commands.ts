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

const Commands = Extension.create<ExtensionOptions>({
  name: 'slashcommand',

  addOptions() {
    return {
      ...this.parent?.(),
      suggestion: {
        char: '/',
        startOfLine: true,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export default Commands
