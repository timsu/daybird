import { useEffect } from 'preact/hooks'
import { DeltaOperation } from 'quill'
import Delta from 'quill-delta'

import Editor from '@/components/editor/Editor'
import { docStore } from '@/stores/docStore'
import { useStore } from '@nanostores/preact'

// document is a higher-order component that manages the doc object
export default ({ filename }: { filename: string | undefined }) => {
  const contents = useStore(docStore.document)

  useEffect(() => {
    if (filename) docStore.loadDoc(filename)
  }, [filename])

  const saveContents = (contents: Delta) => {
    docStore.saveDoc(contents)
  }

  return <Editor contents={contents} saveContents={saveContents} />
}
