import 'quill/dist/quill.bubble.css'
import './quill-style.css'

import { useEffect, useRef } from 'preact/hooks'
import Quill from 'quill'
import Delta from 'quill-delta'

import { config } from '@/config'
import { debounce, DebounceStyle } from '@/utils'

type Props = {
  contents: Delta
  saveContents: (contents: Delta) => void
}

const SAVE_INTERVAL = 5_000

export default ({ contents, saveContents }: Props) => {
  const quillRef = useRef<Quill>()

  useEffect(() => {
    const quill = new Quill('#editor', {
      theme: 'bubble',
    })
    quillRef.current = quill
    if (config.dev) (window as any)['quill'] = quill

    if (contents) quill.setContents(contents)
    quill.focus()

    quill.on('text-change', () => {
      debounce(
        'quill',
        () => saveContents(quill.getContents()),
        SAVE_INTERVAL,
        DebounceStyle.RESET_ON_NEW
      )
      window.onbeforeunload = () => {
        saveContents(quill.getContents())
      }
    })

    return () => (window.onbeforeunload = null)
  }, [])

  useEffect(() => {
    console.log('gazpacho', quillRef.current)
    quillRef.current?.setContents(contents)
  }, [contents])

  return <div id="editor" class="max-w-2xl mx-auto h-full py-8 px-4" />
}
