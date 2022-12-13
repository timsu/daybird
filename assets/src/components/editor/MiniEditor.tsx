import './editor-styles.css'

import { decode } from 'base64-arraybuffer'
import { MutableRef, useEffect, useMemo, useRef } from 'preact/hooks'
import { Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
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
import { Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { uiStore } from '@/stores/uiStore'
import { classNames, debounce, DebounceStyle, lightColorFor, logger } from '@/utils'
import { Editor } from '@tiptap/core'
import Collaboration, { isChangeOrigin } from '@tiptap/extension-collaboration'
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
  readOnly?: boolean
  placeholder?: string
  saveContents?: (project: Project, id: string, contents: any, snippet: string) => void
}

const SAVE_INTERVAL = 5_000

const SNIPPET_LENGTH = 252

export default (props: Props) => {
  const editorRef = useRef<HTMLDivElement | null>(null)

  const { id, contents, placeholder, readOnly } = props

  const { editor, ydoc } = useEditor(props.project?.id + '/' + id, contents, placeholder, !readOnly)
  useAutosave(props, editor, ydoc, editorRef)

  return (
    <div ref={editorRef} class={classNames(props.className, 'print:max-w-none print:p-0')}></div>
  )
}

// hook to initialize the editor

const useEditor = (
  id: string | undefined,
  initialContent: any,
  placeholder: string | undefined,
  editable: boolean
) => {
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
          placeholder,
        }),
        SlashExtension,
        ExistingTasksExtension,
        Collaboration.configure({
          document: ydoc,
        }),
      ],
      editable,
    }))

    if (contentType == 'json') {
      setTimeout(() => editor.commands.setContent(initialContent), 0)
    }

    if (editable && !uiStore.reactNative) {
      setTimeout(() => {
        editor.chain().setTextSelection(editor.state.doc.nodeSize).focus().run()
      }, 50)
    }

    return { editor, ydoc }
  }, [id, initialContent])
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

  useEffect(() => {
    if (!editor || !ydoc) return

    window.editor = editor
    if (editorRef.current && !editorRef.current.children.length) {
      const proseMirror = editor.options.element?.querySelector('.ProseMirror')
      editorRef.current.appendChild(proseMirror!)
    }

    if (!saveContents) return

    currentFile.current = id
    docStore.dirty.set(false)

    const save = () => {
      const text = editor.getText()
      let snippet = text.substring(0, SNIPPET_LENGTH).trim()
      if (text.length > SNIPPET_LENGTH) snippet = snippet + '...'
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
