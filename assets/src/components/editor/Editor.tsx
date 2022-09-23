import './editor-styles.css'

import { useEffect, useMemo, useRef } from 'preact/hooks'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'

import { TaskItem } from '@/components/editor/TaskItem'
import { Project } from '@/models'
import { authStore } from '@/stores/authStore'
import { taskStore } from '@/stores/taskStore'
import { debounce, DebounceStyle } from '@/utils'
import { getUniqueColorObjectForId } from '@/utils/colorScale'
import { useStore } from '@nanostores/preact'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import { Editor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Props = {
  project: Project
  id?: string
  contents?: any
  saveContents: (project: Project, id: string, contents: any) => void
}

const SAVE_INTERVAL = 5_000

export default ({ project, id, contents, saveContents }: Props) => {
  const editor = useListNoteEditor(id)
  useDeleteTaskListener(editor)

  const currentFile = useRef<string>()
  const isDirty = useRef<boolean>()
  useEffect(() => {
    if (!editor) return

    window.editor = editor
    editor.chain().setContent(contents).focus().run()

    // currentFile.current = id
    // isDirty.current = false
    // const textChangeHandler = () => {
    //   isDirty.current = true
    //   debounce(
    //     'save-' + id,
    //     () => {
    //       if (id != currentFile.current) return
    //       saveContents(project, id!, editor.getJSON())
    //       isDirty.current = false
    //     },
    //     SAVE_INTERVAL,
    //     DebounceStyle.RESET_ON_NEW
    //   )
    // }
    // editor.on('update', textChangeHandler)
    // window.onbeforeunload = () => {
    //   if (isDirty.current) saveContents(project, id!, editor.getJSON())
    // }

    // return () => {
    //   editor.off('update', textChangeHandler)
    //   if (isDirty.current) saveContents(project, id!, editor.getJSON())
    //   window.onbeforeunload = null
    // }
  }, [editor, contents])

  return (
    <EditorContent
      class="listnote max-w-2xl mx-auto w-full h-auto grow pt-2 pb-20 px-8"
      editor={editor}
    />
  )
}

const useListNoteEditor = (id: string | undefined) => {
  return useMemo(() => {
    if (!id) return null

    const ydoc = new Y.Doc()
    const provider = new WebrtcProvider(id, ydoc)

    const user = authStore.loggedInUser.get()!

    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          // The Collaboration extension comes with its own history handling
          history: false,
        }),
        TaskItem,
        Placeholder.configure({
          placeholder:
            'Welcome to ListNote!\n\nStart typing to create a note.\n\n' +
            'Type "[] " to create a task.\n\n' +
            'Have fun!',
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user.name,
            color: getUniqueColorObjectForId(user.id),
          },
        }),
      ],
    })
    return editor
  }, [id])
}

function useDeleteTaskListener(editor: Editor | null) {
  useEffect(() => {
    const off = taskStore.deletedTask.listen((task) => {
      if (!task || !editor) return
      // remove all references to this item in the quill document
      const element = document.getElementById('task-' + task.id)
      if (!element) return

      const pos = editor.view.posAtDOM(element, 0)
      if (!pos) return

      editor
        .chain()
        .deleteRange({ from: pos - 1, to: pos + 1 })
        .focus()
        .run()
    })
    return off
  }, [editor])
}
