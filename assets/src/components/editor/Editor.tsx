import './quill.sequence.css'

import { MutableRef, useEffect, useRef } from 'preact/hooks'
import Quill, { QuillOptionsStatic } from 'quill'
import Delta from 'quill-delta'

import QuillConfig from '@/components/editor/QuillConfig'
import { Project } from '@/models'
import { taskStore } from '@/stores/taskStore'
import { debounce, DebounceStyle } from '@/utils'

type Props = {
  project: Project
  filename?: string
  contents: Delta
  saveContents: (project: Project, filename: string, contents: Delta) => void
}

const SAVE_INTERVAL = 5_000

export default ({ project, filename, contents, saveContents }: Props) => {
  const quillRef = useQuill('#editor', {
    theme: 'bubble',
    modules: QuillConfig,
    placeholder:
      'Welcome to ListNote!\n\nStart typing to create a note.\n\n' +
      'Type "[] " to create a task.\n\n' +
      'Have fun!',
  })

  const currentFile = useRef<string>()
  const isDirty = useRef<boolean>()

  useEffect(() => {
    const quill = quillRef.current
    if (!quill || !filename) return

    quill.setContents(contents)
    currentFile.current = filename
    isDirty.current = false
    const textChangeHandler = () => {
      isDirty.current = true
      debounce(
        'quill-' + filename,
        () => {
          if (filename != currentFile.current) return
          saveContents(project, filename, quill.getContents())
        },
        SAVE_INTERVAL,
        DebounceStyle.RESET_ON_NEW
      )
    }
    quill.on('text-change', textChangeHandler)
    window.onbeforeunload = () => {
      if (isDirty.current) saveContents(project, filename, quill.getContents())
    }

    return () => {
      quill.off('text-change', textChangeHandler)
      if (isDirty.current) saveContents(project, filename, quill.getContents())
      window.onbeforeunload = null
    }
  }, [contents])

  useDeleteTaskListener(quillRef)

  return <div id="editor" class="listnote max-w-2xl mx-auto w-full h-auto grow pt-2 pb-20 px-4" />
}

export function useQuill(id: string, options: QuillOptionsStatic) {
  const quillRef = useRef<Quill>()

  // Initialize Quill
  useEffect(() => {
    const quill = new Quill(id, options)
    quillRef.current = quill
    window.quill = quill

    quill.root.setAttribute('autocapitalize', 'sentences')
    quill.root.setAttribute('spellcheck', 'true')

    setTimeout(() => quill.focus(), 50)

    return () => {
      window.quill = undefined
    }
  }, [])

  return quillRef
}

function useDeleteTaskListener(quillRef: MutableRef<Quill | undefined>) {
  useEffect(() => {
    const off = taskStore.deletedTask.listen((task) => {
      if (!task) return
      // remove all references to this item in the quill document
      const element = document.getElementById('task-' + task.id)
      if (!element) return
      const blot = Quill.find(element, true)
      if (!blot) return
      const index = quillRef.current?.getIndex(blot)
      if (typeof index !== 'number') return
      quillRef.current?.deleteText(index, 1)
    })
    return off
  }, [])
}
