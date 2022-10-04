import { render } from 'preact'
import { NodeType } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'

import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'
import { modalStore } from '@/stores/modalStore'
import { taskStore } from '@/stores/taskStore'
import { logger } from '@/utils'
import { InputRule, InputRuleFinder, mergeAttributes, Node } from '@tiptap/core'

export interface TaskItemOptions {
  HTMLAttributes: Record<string, any>
}

const inputRegex = /^\[\]\s(.*)$/

declare module 'prosemirror-state' {
  interface EditorState {
    deleting: boolean
  }
}

export const NODE_NAME = 'task'

export const TaskItem = Node.create<TaskItemOptions>({
  name: NODE_NAME,

  // on FF / Safari, draggable prevents editing contents
  draggable: navigator.userAgent?.includes('Chrome/'),

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

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const container = document.createElement('div')

      const onCreateTask = (task: Task) => {
        const { view } = editor
        if (typeof getPos === 'function') {
          // … dispatch a transaction, for the current position in the document …
          view.dispatch(
            view.state.tr.setNodeMarkup(getPos(), undefined, {
              id: task.id,
            })
          )
        }
        return true
      }

      if (node.attrs.id == 'focus') {
        ;(node.attrs as any).id = null
        ;(node.attrs as any).focus = true
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('taskDeleteHandler'),

        props: {
          handleKeyDown: (view, event) => {
            if (event.which === 8 || event.which === 46) {
              view.state.deleting = true
            }

            return false
          },
        },

        filterTransaction: (transaction, state) => {
          if (!state.deleting) {
            return true
          }
          state.deleting = false

          let result = true // true for keep, false for stop transaction
          const replaceSteps: number[] = []
          transaction.steps.forEach((step, index) => {
            if ((step as any).jsonID === 'replace') {
              replaceSteps.push(index)
            }
          })

          replaceSteps.forEach((index) => {
            const map = transaction.mapping.maps[index] as any
            const oldStart = map.ranges[0]
            const oldEnd = map.ranges[0] + map.ranges[1]
            state.doc.nodesBetween(oldStart, oldEnd, (node) => {
              if (node.type.name === 'task') {
                // prevent deleting of tasks
                logger.info('prosemirror attempt delete', node)
                const id = node.attrs.id
                const taskToDelete = taskStore.deletedTask.get()
                if (id && id != taskToDelete?.id) {
                  result = false
                  const task = taskStore.taskMap.get()[id]
                  modalStore.deleteTaskModal.set(task)
                }
              }
            })
          })
          return result
        },
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

      const from = Math.max(1, range.from - 1)
      const to = Math.min(from - 1 + node.nodeSize, state.doc.nodeSize - 1)

      if (node == state.doc.lastChild) {
        state.tr.insertText('\n', to)
      }
      state.tr.replaceWith(from - 1, to, newNode)
    },
  })
}
