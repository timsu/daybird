import { decode } from 'base64-arraybuffer'
import * as Y from 'yjs'

import { Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { Editor } from '@tiptap/core'
import Collaboration from '@tiptap/extension-collaboration'
import StarterKit from '@tiptap/starter-kit'

export const loadDoc = async (project: Project, id: string, ydoc: Y.Doc) => {
  await docStore.loadDoc(project, id)
  const contents = docStore.doc.get()?.contents
  if (contents) {
    const array = new Uint8Array(decode(contents))
    Y.applyUpdate(ydoc, array)
  }
  return ydoc
}

export const createEditor = (ydoc: Y.Doc) => {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({
        // The Collaboration extension comes with its own history handling
        history: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
    ],
  })
  return editor
}

export const convertToDoc = (ydoc: Y.Doc) => {
  return Y.encodeStateAsUpdate(ydoc)
}
