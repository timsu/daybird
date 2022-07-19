/**
 * https://github.com/visualjerk/quill-magic-url/blob/master/src/index.js
 */
import { EmbedBlot } from 'parchment'
import { render } from 'preact'
import Quill from 'quill'
import Delta from 'quill-delta'

import TaskRow from '@/components/task/TaskRow'

const BlockEmbed = Quill.import('blots/block/embed')

type Data = { id: string }

class SeqTaskBlot extends BlockEmbed {
  static create(data: Data) {
    const node = super.create(data) as HTMLDivElement
    node.dataset['id'] = data.id

    console.log('RENDERED A TASK', node, data)
    render(<TaskRow />, node)

    return node
  }

  static value(domNode: HTMLAnchorElement) {
    return {
      id: domNode.dataset['id'],
    }
  }

  static blotName = 'seqtask'
  static tagName = 'div'
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

        const id = 'S-1'

        this.quill.insertEmbed(startIndex + 1, 'seqtask', { id, focus: true }, Quill.sources.USER)
        this.quill.insertText(startIndex + 2, '\n', Quill.sources.SILENT)
        this.quill.setSelection((startIndex + 2) as any, Quill.sources.SILENT)
      }, 0)
    }
  }
}
