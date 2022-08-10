import './editor-styles.css'

import { useEffect, useRef } from 'preact/hooks'

import { TaskItem } from '@/components/editor/TaskItem'
import { Doc, Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { debounce, DebounceStyle } from '@/utils'
import { EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Props = {
  project: Project
  filename?: string
  contents?: any
  saveContents: (project: Project, filename: string, contents: any) => void
}

const SAVE_INTERVAL = 5_000

export default ({ project, filename, contents, saveContents }: Props) => {
  const editor = useEditor({
    extensions: [StarterKit, TaskItem],
  })

  const currentFile = useRef<string>()
  const isDirty = useRef<boolean>()
  useEffect(() => {
    if (!editor) return

    window.editor = editor
    const legacyDoc = isDeltaDoc(contents)
    editor.chain().setContent(checkContents(contents)).focus().run()

    if (legacyDoc) {
      docStore.docError.set('Note: legacy doc, saving will use new format.')
    }

    currentFile.current = filename
    isDirty.current = false
    const textChangeHandler = () => {
      isDirty.current = true
      debounce(
        'save-' + filename,
        () => {
          if (filename != currentFile.current) return
          saveContents(project, filename!, editor.getJSON())
          isDirty.current = false
        },
        SAVE_INTERVAL,
        DebounceStyle.RESET_ON_NEW
      )
    }
    editor.on('update', textChangeHandler)
    window.onbeforeunload = () => {
      if (isDirty.current) saveContents(project, filename!, editor.getJSON())
    }

    return () => {
      editor.off('update', textChangeHandler)
      if (isDirty.current) saveContents(project, filename!, editor.getJSON())
      window.onbeforeunload = null
    }
  }, [editor, contents])

  return (
    <EditorContent
      class="listnote max-w-2xl mx-auto w-full h-auto grow pt-2 pb-20 px-8"
      editor={editor}
    />
  )
}

type DeltaDoc = { ops: Delta[] }

type Delta = {
  insert?: string | { seqtask: { id: string } }
  attributes?: {
    list?: 'bullet' | 'ordered'
    bold?: boolean
    italic?: boolean
    underline?: boolean
  }
}

function isDeltaDoc(doc: Doc | DeltaDoc | undefined): doc is DeltaDoc {
  return !!(doc as DeltaDoc)?.ops
}

function checkContents(contents: Doc | DeltaDoc): Doc | null {
  if (!contents) return null

  if (isDeltaDoc(contents)) {
    return migrateDelta(contents)
  } else {
    return contents
  }
}

function migrateDelta(doc: DeltaDoc): Doc {
  // phase 1 - replace bullets
  const content: JSONContent[] = []

  doc.ops.forEach((op) => {
    // this needs to apply to the previous insert operation
    if (op.attributes?.list) {
      const listType = op.attributes?.list + 'List'

      const lastNode = content[content.length - 1]
      const prevNode = content[content.length - 2]

      const listItem = {
        type: 'listItem',
        content: lastNode.content,
      }

      // append to list
      if (prevNode && prevNode.type == listType) {
        content.pop()
        prevNode.content?.push(listItem)
      } else {
        lastNode.type = listType
        lastNode.content = [listItem]
      }
    } else if (typeof op.insert === 'string') {
      let type = 'paragraph'
      const text = op.insert.replace(/\n$/, '').replace(/^\n+/, '')
      if (text == '' || text == '\n') return content.push({ type })

      const marks: { type: string }[] | undefined = op.attributes ? [] : undefined
      if (op.attributes?.bold) marks?.push({ type: 'bold' })
      if (op.attributes?.italic) marks?.push({ type: 'italic' })
      if (op.attributes?.underline) marks?.push({ type: 'underline' })

      content.push({
        type,
        content: [
          {
            type: 'text',
            text,
            marks,
          },
        ],
      })
    } else if (op.insert?.seqtask) {
      content.push({
        type: 'task',
        attrs: op.insert.seqtask,
      })
    } else {
      content.push({ type: 'paragraph' })
    }
  })

  return {
    type: 'doc',
    content,
  }
}
