import Quill, { RangeStatic } from 'quill'
import Delta from 'quill-delta'

import { QuillSource } from '@/config'
import { modalStore } from '@/stores/modalStore'
import { taskStore } from '@/stores/taskStore'

type Context = {
  // what modifier was pressed
  shiftKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  shortKey?: boolean // ctrl (win) / meta (mac)

  // whether user is selecting anything
  collapsed?: boolean

  // whether empty line
  empty?: boolean

  // position in the line
  offset?: number

  // detected prefix
  prefix?: string

  // what formats are present
  format?: string[] | { [format: string]: boolean | string }
}

export type Keybinding = {
  // what key to trigger on
  key: string | string[]

  // whether modifier is pressed
  shiftKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  shortKey?: boolean // ctrl (win) / meta (mac)

  // only call when user is not selecting anything
  collapsed?: boolean

  // only call when empty line
  empty?: boolean

  // position in the line
  offset?: number

  // detected prefix
  prefix?: RegExp

  // what formats to trigger on (either true or false)
  format?: string[] | { [format: string]: boolean | string }

  // return whether quill should continue handling the key
  handler: (range: RangeStatic, context: Context) => boolean
}

type Keybindindings = { [name: string]: Keybinding }

type Keyboard = { quill: Quill }

const QuillKeybindings: Keybindindings = {
  // when pressing enter on a blank line with blockquote, return
  clearBlockquote: {
    key: 'enter',
    format: ['blockquote'],
    handler: function (this: Keyboard, range, context) {
      if (context.offset === 0) {
        this.quill.format('blockquote', false, QuillSource.USER)
        return false
      } else {
        // Otherwise propogate to Quill's default
        return true
      }
    },
  },

  // prevent backspace delete tasks
  preventDeleteTasks: {
    key: 'Backspace',
    collapsed: true,
    handler: function (this: Keyboard, range, context) {
      const leaf = this.quill.getLeaf(range.index - 1)[0]
      const blotName = leaf?.statics.blotName
      if (blotName == 'seqtask') {
        const taskElement = leaf!.domNode.children[0] as HTMLElement
        if (document.activeElement == taskElement) return false
        taskElement.focus()
        return false
      }
      return true
    },
  },

  // modified from Quill
  // https://github.com/quilljs/quill/blob/develop/modules/keyboard.js
  'list autofill': {
    key: ' ',
    shiftKey: false,
    collapsed: true,
    format: {
      list: false,
      'code-block': false,
      blockquote: false,
      header: false,
      table: false,
    },
    prefix: /^\s*?(1\.|\*|-)$/,
    handler: function (this: Keyboard, range, context) {
      const { length } = context.prefix!
      const [line, offset] = this.quill.getLine(range.index)
      if (offset > length) return true
      let value
      switch (context.prefix!.trim()) {
        case '[]':
        case '[ ]':
          value = 'unchecked'
          break
        case '[x]':
          value = 'checked'
          break
        case '-':
        case '--':
        case '*':
          value = 'bullet'
          break
        default:
          value = 'ordered'
      }
      this.quill.insertText(range.index, ' ', QuillSource.USER)
      this.quill.getModule('history').cutoff()
      const delta = new Delta()
        .retain(range.index - offset)
        .delete(length + 1)
        .retain(line.length() - 2 - offset)
        .retain(1, { list: value })
      this.quill.updateContents(delta, QuillSource.USER)
      this.quill.getModule('history').cutoff()
      this.quill.setSelection(range.index - length, 0, QuillSource.SILENT)
      return false
    },
  },
}

export default QuillKeybindings
