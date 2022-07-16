import 'quill/dist/quill.bubble.css'
import './quill-style.css'

import { useEffect, useRef } from 'preact/hooks'
import Quill from 'quill'

import { config } from '@/config'

export default () => {
  const quillRef = useRef<Quill>()

  useEffect(() => {
    const quill = new Quill('#editor', {
      theme: 'bubble',
    })
    quillRef.current = quill
    if (config.dev) (window as any)['quill'] = quill

    quill.focus()
  }, [])

  return (
    <div id="editor" class="max-w-2xl mx-auto h-full py-8 px-4">
      <p>Hello World!</p>
      <p>
        Some initial <strong>bold</strong> text
      </p>
      <p>
        <br />
      </p>
    </div>
  )
}
