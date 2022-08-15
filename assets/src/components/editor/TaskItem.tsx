import { render } from 'preact'
import { NodeType } from 'prosemirror-model'

import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'
import { logger } from '@/utils'
import {
    ExtendedRegExpMatchArray, InputRule, InputRuleFinder, mergeAttributes, Node
} from '@tiptap/core'

export interface TaskItemOptions {
  HTMLAttributes: Record<string, any>
}

const inputRegex = /^\[\]\s(.*)$/

export const TaskItem = Node.create<TaskItemOptions>({
  name: 'task',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  // content: 'inline*',

  group: 'block',

  defining: true,

  addAttributes() {
    return {
      id: {
        default: undefined,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => ({
          'data-id': attributes.id,
        }),
      },
      title: {
        default: undefined,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
    ]
  },

  addKeyboardShortcuts() {
    const shortcuts = {
      Backspace: () => {
        const pos = this.editor.state.selection
        const line = this.editor.state.doc.textBetween(
          pos.from,
          pos.to == pos.from ? pos.to + 1 : pos.to
        )

        logger.info('taskitem: eat backspace?', line, pos)
        // if (line == '')
        //   // blank line, allow delete
        //   return false
        // return true

        return false
      },
    }

    return shortcuts
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const container = document.createElement('div')

      const onCreateTask = (task: Task) => {
        if (typeof getPos != 'function') return
        editor.commands.command(({ tr }) => {
          const position = getPos()
          tr.setNodeMarkup(position, undefined, {
            id: task.id,
          })
          return true
        })
      }

      const listItem = render(
        <TaskRow
          id={node.attrs.id}
          initialTitle={node.attrs.title}
          focus={node.attrs.focus}
          onCreate={onCreateTask}
          showContext={node.attrs.ref}
        />,
        container
      )

      return {
        dom: container,
        contentDOM: listItem,
      }
    }
  },

  addInputRules() {
    return [
      taskInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ]
  },
})

/**
 * Build an input rule that changes the type of a textblock when the
 * matched text is typed into it. When using a regular expresion you’ll
 * probably want the regexp to start with `^`, so that the pattern can
 * only occur at the start of a textblock.
 */
function taskInputRule(config: { find: InputRuleFinder; type: NodeType }) {
  return new InputRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      const $start = state.doc.resolve(range.from)
      const node = $start.node()

      const fullText = node.textContent
      const title = fullText.replace(/^\[\]\s*/, '')
      const attributes = {
        focus: true,
        title,
      }

      const newNode = config.type.create(attributes)
      // add 'focus' as a run-time attribute
      ;(newNode.attrs as any).focus = true

      state.tr.replaceWith(range.from, range.from + node.nodeSize, newNode)
    },
  })
}
