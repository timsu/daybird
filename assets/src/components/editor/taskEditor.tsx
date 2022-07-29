/**
 * https://github.com/visualjerk/quill-magic-url/blob/master/src/index.js
 */
import { render } from 'preact'
import Quill from 'quill'

import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'
import { projectStore } from '@/stores/projectStore'

const BlockEmbed = Quill.import('blots/block/embed')

type Data = { id: string; focus?: boolean; title?: string; ref?: boolean }

class SeqTaskBlot extends BlockEmbed {
  static create(data: Data) {
    const node = super.create(data) as HTMLDivElement
    node.dataset['id'] = data.id
    node.dataset['ref'] = data.ref?.toString()
    node.style.overflow = 'hidden'

    const onCreateTask = (task: Task) => {
      node.dataset['id'] = task.id
    }

    node.childNodes.forEach((n) => n.remove())
    render(
      <TaskRow
        id={data.id}
        initialTitle={data.title}
        focus={data.focus}
        onCreate={onCreateTask}
        showContext={data.ref}
      />,
      node
    )

    return node
  }

  static value(domNode: HTMLAnchorElement) {
    const id = domNode.dataset['id']
    if (!id) return {}
    const data: Data = {
      id,
    }
    if (domNode.dataset['ref']) data.ref = true
    return data
  }

  update(mutations: any) {
    // nothing to do at the moment
  }

  static blotName = 'seqtask'
  static tagName = 'div'
  static className = 'seqtask'
}

Quill.register('formats/seqtask', SeqTaskBlot)

type Options = {}

export default class TaskEditor {
  quill: Quill
  options: Options

  constructor(quill: Quill, options: Options) {
    this.quill = quill
    this.options = options

    this.registerTypeListener()
  }

  registerTypeListener() {
    this.quill.on('text-change', (delta) => {
      const ops = delta.ops
      // Only return true, if last operation includes whitespace inserts
      // Equivalent to listening for enter, tab or space
      if (!ops || ops.length < 1 || ops.length > 2) {
        return
      }
      const lastOp = ops[ops.length - 1]
      if (!lastOp.insert || typeof lastOp.insert !== 'string' || !lastOp.insert.match(/\s/)) {
        return
      }

      if (lastOp.insert == ' ') this.onSpace()
    })
  }

  onSpace() {
    const selection = this.quill.getSelection()
    if (!selection) return
    const [line, offset] = this.quill.getLine(selection.index)
    const text = line.domNode.textContent as string

    if (text.startsWith('[] ')) {
      const remainder = text.substring(3)
      const startIndex = selection.index - 3
      setTimeout(() => {
        this.quill.deleteText(startIndex, text.length + 1)
        this.quill.insertEmbed(
          startIndex,
          'seqtask',
          { focus: true, title: remainder },
          Quill.sources.USER
        )
        if (startIndex + 2 >= this.quill.getLength())
          this.quill.insertText(startIndex + 2, '\n', Quill.sources.SILENT)
        this.quill.setSelection((startIndex + 1) as any, Quill.sources.SILENT)
      }, 0)
    }
  }
}
