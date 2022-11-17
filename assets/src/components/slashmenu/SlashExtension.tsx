import { PluginKey } from 'prosemirror-state'

import { MenuComponentProps } from '@/components/slashmenu/CommandListController'
import renderItems from '@/components/slashmenu/renderItems'
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

const SlashMenu = function ({ items, selectedIndex, selectItem }: MenuComponentProps<CommandItem>) {
  return (
    <div class="shadow rounded bg-white flex flex-col w-52">
      {items.map((item, index) => {
        return (
          <button
            className={`text-left p-2 hover:bg-gray-400 text-sm flex ${
              index === selectedIndex ? 'bg-gray-300' : ''
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div class="flex-1">{item.title}</div>
            {item.shortcut && <div class="opacity-50">{item.shortcut}</div>}
          </button>
        )
      })}
    </div>
  )
}

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
