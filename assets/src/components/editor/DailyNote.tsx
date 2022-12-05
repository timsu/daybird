import { useEffect } from 'preact/hooks'

import Loader from '@/components/core/Loader'
import MiniEditor from '@/components/editor/MiniEditor'
import { Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import { useStore } from '@nanostores/preact'

// document is a higher-order component that manages the doc object
export default ({ project, date, id }: { project: Project; date: string; id?: string }) => {
  const doc = useStore(docStore.doc)

  useEffect(() => {
    if (project && id) {
      docStore.loadDoc(project, id, true)
    } else {
      docStore.initEmptyDoc(date)
    }
  }, [project, id])

  const saveContents = (project: Project, id: string, contents: any, snippet: string) => {
    if (id) docStore.saveDoc(project, id, contents)
    journalStore.saveNote(project, date, contents, snippet).then((note) => {
      if (!id) docStore.saveDoc(project, note.id, contents)
    })
  }

  if (!project) return null

  if (!doc || doc.contents === undefined)
    return (
      <div className="flex justify-center mt-10">
        <Loader size={40} />
      </div>
    )

  return (
    <MiniEditor
      className="h-1 min-h-[14rem]"
      project={project}
      id={doc.id}
      contents={doc.contents}
      saveContents={saveContents}
    />
  )
}
