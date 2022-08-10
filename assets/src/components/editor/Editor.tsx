import './editor-styles.css'

import { useEffect, useRef } from 'preact/hooks'

import { TaskItem } from '@/components/editor/TaskItem'
import { Doc, Project } from '@/models'
import { debounce, DebounceStyle } from '@/utils'
import { EditorContent, useEditor } from '@tiptap/react'
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
    if (legacyDoc) {
      editor.commands.setContent('LEGACY DOC')
      return
    }

    editor.chain().setContent(contents).focus().run()

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
  attributes?: { list?: 'bullet' }
}

function isDeltaDoc(doc: Doc | DeltaDoc | undefined): doc is DeltaDoc {
  return !!(doc as DeltaDoc)?.ops
}

function checkContents(contents: Doc | DeltaDoc) {
  if (!contents) return null

  if (isDeltaDoc(contents)) {
    // todo replace
    return ''
  } else {
    return contents
  }
}
