import './editor-styles.css'

import { decode } from 'base64-arraybuffer'
import { endOfDay, isBefore } from 'date-fns'
import { MutableRef, useEffect, useMemo, useRef } from 'preact/hooks'
import { Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'

import { HorizontalRule } from '@/components/editor/HorizontalRule'
import { Image } from '@/components/editor/Image'
import { LegacyTaskItem } from '@/components/editor/LegacyTaskItem'
import Link from '@/components/editor/Link'
import { TaskItem } from '@/components/editor/TaskItem'
import { TaskList } from '@/components/editor/TaskList'
import { Video } from '@/components/editor/Video'
import { WikiLink } from '@/components/editor/WikiLink'
import ExistingTasksExtension from '@/components/slashmenu/ExistingTaskExtension'
import SlashExtension from '@/components/slashmenu/SlashExtension'
import { paths } from '@/config'
import { Project } from '@/models'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { uiStore } from '@/stores/uiStore'
import { classNames, debounce, DebounceStyle, lightColorFor, logger } from '@/utils'
import { useStore } from '@nanostores/preact'
import { Editor } from '@tiptap/core'
import Collaboration, { isChangeOrigin } from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Focus from '@tiptap/extension-focus'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'

// Hack to prevent the matchesNode error on hot reloads
EditorView.prototype.updateState = function updateState(state) {
  if (!(this as any).docView) return
  ;(this as any).updateStateInner(state, this.state.plugins != state.plugins)
}

type Props = {
  project: Project
  id?: string
  contents?: any
  className?: string
  saveContents: (project: Project, id: string, contents: any, snippet: string) => void
}

const SAVE_INTERVAL = 5_000

const PLACEHOLDER = "What's on your mind?"

export default (props: Props) => {
  const editorRef = useRef<HTMLDivElement | null>(null)

  const { id, contents } = props
  const { editor, ydoc } = useEditor(props.project?.id + '/' + id, contents)
  useAutosave(props, editor, ydoc, editorRef)

  return (
    <div class={classNames(props.className, 'overflow-y-scroll print:max-w-none print:p-0')}>
      <div ref={editorRef} class="h-full" />
    </div>
  )
}

// hook to initialize the editor

const useEditor = (id: string | undefined, initialContent: any) => {
  const prevEditor = useRef<Editor>()
  const prevDoc = useRef<Y.Doc>()

  // clean up on unmount
  useEffect(() => {
    return () => {
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
        const array =
          initialContent instanceof Uint8Array
            ? initialContent
            : new Uint8Array(decode(initialContent))
        Y.applyUpdate(ydoc, array)
      }
    } catch (e) {
      logger.error('error loading', e, initialContent)
    }

    const isToday = location.pathname.startsWith(paths.TODAY)

    const user = authStore.loggedInUser.get()!
    const editor = (prevEditor.current = new Editor({
      extensions: [
        StarterKit.configure({
          // The Collaboration extension comes with its own history handling
          history: false,
          horizontalRule: false,
        }),
        HorizontalRule,
        TaskItem.configure({
          nested: true,
        }),
        TaskList,
        Image,
        Video,
        WikiLink,
        Focus.configure({
          mode: 'deepest',
        }),
        Link.configure({
          autolink: false,
          linkOnPaste: true,
        }),
        Placeholder.configure({
          placeholder: PLACEHOLDER,
        }),
        SlashExtension,
        ExistingTasksExtension,
        Collaboration.configure({
          document: ydoc,
        }),
      ],
    }))

    if (contentType == 'json') {
      setTimeout(() => editor.commands.setContent(initialContent), 0)
    }

    setTimeout(() => {
      editor.chain().setTextSelection(editor.state.doc.nodeSize).focus().run()
    }, 50)

    return { editor, ydoc }
  }, [id, initialContent])
}

// hook to autosave when doc is modified
let autoAddingTasks = false
function useAutosave(
  props: Props,
  editor: Editor | null,
  ydoc: Y.Doc | null,
  editorRef: MutableRef<HTMLDivElement | null>
) {
  const { id, project, saveContents } = props
  const currentFile = useRef<string>()

  useEffect(() => {
    if (!editor || !ydoc) return

    window.editor = editor
    if (editorRef.current && !editorRef.current.children.length) {
      const proseMirror = editor.options.element.querySelector('.ProseMirror')
      editorRef.current.appendChild(proseMirror!)
    }

    currentFile.current = id
    docStore.dirty.set(false)

    const save = () => {
      const text = editor.getText()
      let snippet = text.substring(0, 96).trim()
      if (text.length > 96) snippet = snippet + '...'
      saveContents(project, id!, Y.encodeStateAsUpdate(ydoc), snippet)
    }

    const textChangeHandler = ({
      editor,
      transaction,
    }: {
      editor: Editor
      transaction: Transaction
    }) => {
      // ignore non-local changes
      if (transaction && isChangeOrigin(transaction)) return
      if (autoAddingTasks) return

      docStore.dirty.set(true)
      debounce(
        'save-' + id,
        () => {
          if (id != currentFile.current) return
          save()
          docStore.dirty.set(false)
        },
        SAVE_INTERVAL,
        DebounceStyle.RESET_ON_NEW
      )
    }
    editor.on('update', textChangeHandler)
    window.onbeforeunload = () => {
      if (docStore.dirty.get()) save()
    }

    return () => {
      editor.off('update', textChangeHandler)
      if (docStore.dirty.get()) save()
      window.onbeforeunload = null
    }
  }, [editor])
}
