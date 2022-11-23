import { createRef, render } from 'preact'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import toast from 'react-hot-toast'

import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'
import { docStore } from '@/stores/docStore'
import { taskStore } from '@/stores/taskStore'
import { debounce, DebounceStyle, pluralizeWithCount } from '@/utils'
import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core'

export interface TaskItemOptions {
  onReadOnlyChecked?: (node: ProseMirrorNode, checked: boolean) => boolean
  nested: boolean
  HTMLAttributes: Record<string, any>
}

export const inputRegex = /^\s*(\[([( |x])?\])\s$/

declare module 'prosemirror-state' {
  interface EditorState {
    deleting: boolean
  }
}

export const TaskItem = Node.create<TaskItemOptions>({
  name: 'taskItem',

  addOptions() {
    return {
      nested: false,
      HTMLAttributes: {},
    }
  },

  content() {
    return this.options.nested ? 'paragraph block*' : 'paragraph+'
  },

  defining: true,

  addAttributes() {
    return {
      id: {
        default: undefined,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => ({
          'data-id': attributes.id || '',
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`,
        priority: 51,
      },
      {
        tag: `div[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
      [
        'label',
        [
          'input',
          {
            type: 'checkbox',
          },
        ],
        ['span'],
      ],
      ['div', 0],
    ]
  },

  addKeyboardShortcuts() {
    const shortcuts = {
      Enter: () => this.editor.commands.splitListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    }

    if (!this.options.nested) {
      return shortcuts
    }

    return {
      ...shortcuts,
      Tab: () => this.editor.commands.sinkListItem(this.name),
    }
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li')
      if (node.attrs.id) listItem.id = 'task-' + node.attrs.id
      const ref = createRef<HTMLDivElement>()
      const oldPos = typeof getPos === 'function' ? getPos() : editor.state.selection.$head.pos

      const onCreateTask = (task: Task | null) => {
        if (typeof getPos === 'function') {
          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const position = getPos() || oldPos
              const currentNode = tr.doc.nodeAt(position)

              tr.setNodeMarkup(position, undefined, {
                ...currentNode?.attrs,
                id: task?.id,
              })

              return true
            })
            .run()
        }
        return true
      }

      render(
        <TaskRow
          id={node.attrs.id}
          contentRef={ref}
          onCreate={onCreateTask}
          currentDoc={docStore.doc.get()?.id}
        />,
        listItem
      )

      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })

      if (node.attrs.id) listItem.dataset.id = node.attrs.id

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })

      return {
        dom: listItem,
        contentDOM: ref.current,
        destroy: () => {
          if (pendingDeleted.includes(node.attrs.id)) {
            onDeleteTask(node.attrs.id)
          }
        },
      }
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => ({
          checked: match[match.length - 1] === 'x',
        }),
      }),
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('taskDeleteHandler'),

        props: {
          handleKeyDown: (view, event) => {
            if (event.which === 8 || event.which === 46 || event.which == 68) {
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

          const replaceSteps: number[] = []
          transaction.steps.forEach((step, index) => {
            if ((step as any).jsonID === 'replace') {
              pendingDeleted = []
              replaceSteps.push(index)
            }
          })

          replaceSteps.forEach((index) => {
            const map = transaction.mapping.maps[index] as any
            const oldStart = map.ranges[0]
            const oldEnd = map.ranges[0] + map.ranges[1]

            state.doc.nodesBetween(oldStart, oldEnd, (node) => {
              if (node.type.name === 'task') {
                if (node.attrs.id && node.attrs.id != taskStore.deletedTask.get()?.id)
                  pendingDeleted.push(node.attrs.id)
              }
            })
          })
          return true
        },
      }),
    ]
  },
})

let pendingDeleted: string[] = []
let deletedTasks: string[] = []

const onDeleteTask = (id: string) => {
  // deletes will come in one at a time - we queue them and then show a toast for all of them
  deletedTasks.push(id)
  debounce(
    'delete-tasks',
    () => {
      const tasks = deletedTasks.map((id) => taskStore.taskMap.get()[id])
      tasks.forEach((task) => taskStore.deleteTask(task))
      const count = deletedTasks.length
      deletedTasks = []
      pendingDeleted = []

      toast(
        (t) => (
          <div class="flex items-center gap-2">
            {pluralizeWithCount('task', count)} deleted.
            <button
              onClick={() => {
                toast.dismiss(t.id)
                tasks.forEach((task) => taskStore.undeleteTask(task))
                window.editor?.commands.undo()
              }}
              class="px-2 py-1 shadow bg-gray-200 ml-2 hover:bg-gray-400 rounded"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 10_000 }
      )
    },
    500,
    DebounceStyle.RESET_ON_NEW
  )
}
