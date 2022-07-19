import 'quill/dist/quill.bubble.css'
import './quill-style.css'

import { useEffect, useRef } from 'preact/hooks'
import Quill from 'quill'
import Delta from 'quill-delta'

import { config } from '@/config'
import { debounce, DebounceStyle } from '@/utils'

type Props = {
  filename?: string
  contents: Delta
  saveContents: (filename: string, contents: Delta) => void
}

const SAVE_INTERVAL = 5_000

export default ({ filename, contents, saveContents }: Props) => {
  const quillRef = useRef<Quill>()
  const textChangeHandler = useRef<() => void>()
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

    // clear existing text change handler. invoke one last time if dirty
    if (textChangeHandler.current) {
      if (isDirty.current) saveContents(currentFile.current!, quill.getContents())
      quillRef.current?.off('text-change', textChangeHandler.current)
    }

    quill.setContents(contents)
    currentFile.current = filename
    isDirty.current = false
    textChangeHandler.current = () => {
      isDirty.current = true
      debounce(
        'quill-' + filename,
        () => {
          if (filename != currentFile.current) return
          saveContents(filename, quill.getContents())
        },
        SAVE_INTERVAL,
        DebounceStyle.RESET_ON_NEW
      )
    }
    quill.on('text-change', textChangeHandler.current)
    window.onbeforeunload = () => {
      if (isDirty.current) saveContents(filename, quill.getContents())
    }

    return () => (window.onbeforeunload = null)
  }, [contents])

  return <div id="editor" class="max-w-2xl mx-auto h-full py-8 px-4" />
}
