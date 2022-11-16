import { NodeType } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'

import { InputRule, InputRuleFinder, mergeAttributes, Node } from '@tiptap/core'

export interface HorizontalRuleOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    horizontalRule: {
      /**
       * Add a horizontal rule
       */
      setHorizontalRule: () => ReturnType
    }
  }
}

export const HorizontalRule = Node.create<HorizontalRuleOptions>({
  name: 'horizontalRule',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  parseHTML() {
    return [{ tag: 'hr' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setHorizontalRule:
        () =>
        ({ chain }) => {
          return (
            chain()
              .insertContent({ type: this.name })
              // set cursor after horizontal rule
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  const { $to } = tr.selection
                  const posAfter = $to.end()

                  if ($to.nodeAfter) {
                    tr.setSelection(TextSelection.create(tr.doc, $to.pos))
                  } else {
                    // add node after horizontal rule if it’s the end of the document
                    const node = $to.parent.type.contentMatch.defaultType?.create()

                    if (node) {
                      tr.insert(posAfter, node)
                      tr.setSelection(TextSelection.create(tr.doc, posAfter))
                    }
                  }

                  tr.scrollIntoView()
                }

                return true
              })
              .run()
          )
        },
    }
  },

  addInputRules() {
    return [
      hrInputRule({
        find: /^(?:---|—-|___\s|\*\*\*\s)$/,
        type: this.type,
      }),
    ]
  },
})

function hrInputRule(config: { find: InputRuleFinder; type: NodeType }) {
  return new InputRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      const $start = state.doc.resolve(range.from)
      const node = $start.node()

      const newNode = config.type.create()
      const from = Math.max(0, range.from - 1)
      const to = Math.min(range.to, state.doc.nodeSize - 1)

      if (node == state.doc.lastChild) {
        state.tr.insertText('', to).split(to)
      }
      state.tr.replaceWith(from, to, newNode)
    },
  })
}
