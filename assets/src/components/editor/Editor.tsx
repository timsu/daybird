import './editor-styles.css'

import { Project } from '@/models'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Props = {
  project: Project
  filename?: string
  contents?: any
  saveContents: (project: Project, filename: string, contents: any) => void
}

const SAVE_INTERVAL = 5_000

export default ({ project, filename, contents, saveContents }: Props) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `
      <h2>
        Hi there,
      </h2>
`,
  })

  return (
    <EditorContent
      class="listnote max-w-2xl mx-auto w-full h-auto grow pt-2 pb-20 px-8"
      editor={editor}
    />
  )
}
