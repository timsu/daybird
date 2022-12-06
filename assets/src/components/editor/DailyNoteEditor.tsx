import { useEffect } from 'preact/hooks'

import Loader from '@/components/core/Loader'
import MiniEditor from '@/components/editor/MiniEditor'
import { Period, Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import { useStore } from '@nanostores/preact'

type Props = { project: Project; date: string; id?: string; type: Period }

// document is a higher-order component that manages the doc object
export default ({ project, date, id, type }: Props) => {
  const doc = useStore(docStore.doc)

  useEffect(() => {
    if (project && id) {
      docStore.loadDoc(project, id, true)
    } else {
      docStore.initEmptyDoc(date)
    }
  }, [project, id])

  const saveContents = (project: Project, id: string, contents: any, snippet: string) => {
    docStore.saveDoc(project, id, contents)
    journalStore.saveNote(project, type, date, contents, snippet, id)
  }

  if (!project) return null

  if (!doc || doc.contents === undefined)
    return (
      <div className="flex justify-center mt-10">
        <Loader size={40} />
      </div>
    )

  const placeholder = type == Period.DAY ? "What's on your mind?" : 'Your insights looking back...'

  return (
    <MiniEditor
      className="min-h-[14rem]"
      project={project}
      id={doc.id}
      contents={doc.contents}
      saveContents={saveContents}
      placeholder={placeholder}
    />
  )
}
