import { render } from 'preact'

import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'
import { logger } from '@/utils'
import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'

export interface TaskItemOptions {
  HTMLAttributes: Record<string, any>
}

const inputRegex = /^\s*\[\]\s(.*)$/

export const TaskItem = Node.create<TaskItemOptions>({
  name: 'task',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  content: 'inline*',

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
        if (line == '')
          // blank line, allow delete
          return false
        return true
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
          const currentNode = tr.doc.nodeAt(position)
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
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => ({
          focus: true,
          title: match,
        }),
      }),
    ]
  },
})
