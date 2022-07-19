import Quill, { RangeStatic } from 'quill'

import { QuillSource } from '@/config'

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
  format: string[] | { [format: string]: boolean | string }
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
  format: string[] | { [format: string]: boolean | string }

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
}

export default QuillKeybindings
