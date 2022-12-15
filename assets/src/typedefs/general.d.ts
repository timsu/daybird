import * as Y from 'yjs'

import { Editor } from '@tiptap/core'

declare global {
  interface Window {
    editor?: Editor
    ydoc?: Y.Doc
    ReactNativeWebView?: {
      postMessage: (data: string) => void
    }
  }
}
