import 'quill/dist/quill.bubble.css'
import './quill.sequence.css'

import { MutableRef, useEffect, useRef } from 'preact/hooks'
import Quill, { StringMap } from 'quill'
import Delta from 'quill-delta'
import { text } from 'stream/consumers'

import QuillConfig from '@/components/editor/QuillConfig'
import { config } from '@/config'
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
  const quillRef = useQuill('#editor', QuillConfig)

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

  return <div id="editor" class="max-w-2xl mx-auto h-full py-8 px-4" />
}

export function useQuill(id: string, modules: StringMap) {
  const quillRef = useRef<Quill>()

  // Initialize Quill
  useEffect(() => {
    const quill = new Quill(id, {
      theme: 'bubble',
      modules,
    })
    quillRef.current = quill
    if (config.dev) (window as any)['quill'] = quill

    quill.focus()
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
