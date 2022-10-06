import './editor-styles.css'

import { decode } from 'base64-arraybuffer'
import { MutableRef, useEffect, useMemo, useRef } from 'preact/hooks'
import { Transaction } from 'prosemirror-state'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'

import { HorizontalRule } from '@/components/editor/HorizontalRule'
import { Image } from '@/components/editor/Image'
import { MenuBar } from '@/components/editor/MenuBar'
import { TaskItem } from '@/components/editor/TaskItem'
import { Project } from '@/models'
import { authStore } from '@/stores/authStore'
import { taskStore } from '@/stores/taskStore'
import { classNames, debounce, DebounceStyle, lightColorFor, logger } from '@/utils'
import { Editor } from '@tiptap/core'
import Collaboration, { isChangeOrigin } from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'

type Props = {
  project: Project
  id?: string
  contents?: any
  saveContents: (project: Project, id: string, contents: any) => void
}

const SAVE_INTERVAL = 5_000

export default (props: Props) => {
  const editorRef = useRef<HTMLDivElement | null>(null)

  const { id, contents } = props
  const { editor, ydoc } = useListNoteEditor(id, contents)
  useAutosave(props, editor, ydoc, editorRef)
  useDeleteTaskListener(editor)

  return (
    <div
      class={classNames(
        'max-w-2xl mx-auto w-full h-auto grow pt-4 pb-20 px-8 bg-white rounded-md mt-4 shadow',
        'print:shadow-none print:max-w-none print:p-0'
      )}
    >
      {editor && <MenuBar editor={editor} />}
      <div ref={editorRef} class="listnote mt-4 h-full" />
    </div>
  )
}

// hook to initialize the editor

const useListNoteEditor = (id: string | undefined, initialContent: any) => {
  const prevEditor = useRef<Editor>()
  const prevDoc = useRef<Y.Doc>()

  // clean up on unmount
  useEffect(() => {
    return () => {
      logger.info('cleaning up editors')
      if (prevEditor.current) prevEditor.current.destroy()
      if (prevDoc.current) prevDoc.current.destroy()
    }
  }, [])

  return useMemo(() => {
    if (prevEditor.current) prevEditor.current.destroy()
    if (prevDoc.current) prevDoc.current.destroy()
    if (!id) return { editor: null, ydoc: null }

    prevDoc.current = prevEditor.current = undefined

    const ydoc = (prevDoc.current = window.ydoc = new Y.Doc())

    const contentType = !initialContent ? 'empty' : initialContent.type ? 'json' : 'ydoc'

    try {
      if (contentType == 'ydoc') {
        const array = new Uint8Array(decode(initialContent))

        Y.applyUpdate(ydoc, array)
      }
    } catch (e) {
      logger.error('error loading', e)
    }

    const provider = new WebrtcProvider(id, ydoc)

    const user = authStore.loggedInUser.get()!
    const editor = (prevEditor.current = new Editor({
      extensions: [
        StarterKit.configure({
          // The Collaboration extension comes with its own history handling
          history: false,
          horizontalRule: false,
        }),
        HorizontalRule,
        TaskItem,
        Image,
        Link.configure({
          autolink: false,
          linkOnPaste: true,
        }),
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
            color: lightColorFor(user.id),
          },
        }),
      ],
    }))

    if (contentType == 'json') {
      setTimeout(() => editor.commands.setContent(initialContent), 0)
    }
    setTimeout(() => editor.commands.focus(), 0)

    return { editor, ydoc }
  }, [id])
}

// hook to autosave when doc is modified
function useAutosave(
  props: Props,
  editor: Editor | null,
  ydoc: Y.Doc | null,
  editorRef: MutableRef<HTMLDivElement | null>
) {
  const { id, project, saveContents } = props
  const currentFile = useRef<string>()
  const isDirty = useRef<boolean>()

  useEffect(() => {
    if (!editor || !ydoc) return

    window.editor = editor
    if (editorRef.current && !editorRef.current.children.length) {
      const proseMirror = editor.options.element.querySelector('.ProseMirror')
      editorRef.current.appendChild(proseMirror!)
    }

    currentFile.current = id
    isDirty.current = false
    const textChangeHandler = ({
      editor,
      transaction,
    }: {
      editor: Editor
      transaction: Transaction
    }) => {
      // ignore non-local changes
      if (transaction && isChangeOrigin(transaction)) return

      isDirty.current = true
      debounce(
        'save-' + id,
        () => {
          if (id != currentFile.current) return
          saveContents(project, id!, Y.encodeStateAsUpdate(ydoc))
          isDirty.current = false
        },
        SAVE_INTERVAL,
        DebounceStyle.RESET_ON_NEW
      )
    }
    editor.on('update', textChangeHandler)
    window.onbeforeunload = () => {
      if (isDirty.current) saveContents(project, id!, Y.encodeStateAsUpdate(ydoc))
    }

    return () => {
      editor.off('update', textChangeHandler)
      if (isDirty.current) saveContents(project, id!, Y.encodeStateAsUpdate(ydoc))
      window.onbeforeunload = null
    }
  }, [editor])
}

// hook to look for deleted tasks and remove from the document
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
