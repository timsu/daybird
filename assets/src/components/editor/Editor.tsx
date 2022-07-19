import 'quill/dist/quill.bubble.css'
import './quill.sequence.css'

import { useEffect, useRef } from 'preact/hooks'
import Quill from 'quill'
import Delta from 'quill-delta'
import { text } from 'stream/consumers'

import { config } from '@/config'
import { Project } from '@/models'
import { debounce, DebounceStyle } from '@/utils'

type Props = {
  project: Project
  filename?: string
  contents: Delta
  saveContents: (project: Project, filename: string, contents: Delta) => void
}

const SAVE_INTERVAL = 5_000

export default ({ project, filename, contents, saveContents }: Props) => {
  const quillRef = useRef<Quill>()
  const currentFile = useRef<string>()
  const isDirty = useRef<boolean>()

  useEffect(() => {
    const quill = new Quill('#editor', {
      theme: 'bubble',
    })
    quillRef.current = quill
    if (config.dev) (window as any)['quill'] = quill

    quill.focus()
  }, [])

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

  return <div id="editor" class="max-w-2xl mx-auto h-full py-8 px-4" />
}
