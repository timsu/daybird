import { CommandItem } from '@/components/slashmenu/CommandsList'
import { Editor, Extension, Range } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'

type ExtensionOptions = {
  suggestion: Partial<SuggestionOptions<CommandItem>>
}

const Commands = Extension.create<ExtensionOptions>({
  name: 'slashmenu',

  defaultOptions: {
    suggestion: {
      char: '/',
      startOfLine: false,
      command: ({ editor, range, props }) => {
        props.command({ editor, range })
      },
    },
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
