import { PluginKey } from 'prosemirror-state'

import renderItems from '@/components/slashmenu/renderItems'
import SlashMenu from '@/components/slashmenu/SlashMenu'
import slashMenuItems from '@/components/slashmenu/slashMenuItems'
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

const pluginKey = new PluginKey('slashmenu')

const SlashExtension = Extension.create<ExtensionOptions>({
  name: 'slashmenu',

  addOptions() {
    return {
      ...this.parent?.(),
      suggestion: {
        char: '/',
        startOfLine: true,
        items: slashMenuItems,
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

export default SlashExtension
