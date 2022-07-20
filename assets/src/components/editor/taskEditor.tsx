/**
 * https://github.com/visualjerk/quill-magic-url/blob/master/src/index.js
 */
import { render } from 'preact'
import Quill from 'quill'

import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'

const Embed = Quill.import('blots/embed')
const BlockEmbed = Quill.import('blots/block/embed')

type Data = { id: string; focus?: boolean }

class SeqTaskBlot extends Embed {
  static create(data: Data) {
    const node = super.create(data) as HTMLDivElement
    node.dataset['id'] = data.id

    const onCreate = (task: Task) => {
      node.dataset['id'] = task.id
      console.log('on create', task, node)
    }

    render(<TaskRow id={data.id} focus={data.focus} onCreate={onCreate} />, node)

    return node
  }

  static value(domNode: HTMLAnchorElement) {
    const id = domNode.dataset['id']
    if (!id) return {}
    return {
      id,
    }
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
    const text = line.domNode.textContent

    if (text == '- ') {
      const startIndex = selection.index - text.length
      setTimeout(() => {
        this.quill.deleteText(startIndex, text.length)

        this.quill.insertEmbed(startIndex, 'seqtask', { id: null, focus: true }, Quill.sources.USER)
        this.quill.setSelection((startIndex + 1) as any, Quill.sources.SILENT)
      }, 0)
    }
  }
}