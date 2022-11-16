import { createRef, render } from 'preact'
import { MutableRef, useEffect, useRef } from 'preact/hooks'
import { Node as ProseMirrorNode } from 'prosemirror-model'

import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'
import { docStore } from '@/stores/docStore'
import { taskStore } from '@/stores/taskStore'
import { useStore } from '@nanostores/preact'
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
  name: 'task',

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
      // listItem.contentEditable = 'false'
      const ref = createRef<HTMLDivElement>()
      const oldPos = typeof getPos === 'function' ? getPos() : editor.state.selection.$head.pos

      const onCreateTask = (task: Task | null) => {
        const { view } = editor
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
          currentDoc={docStore.id.get()}
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
})
