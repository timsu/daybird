import { useEffect } from 'preact/hooks'
import { DeltaOperation } from 'quill'
import Delta from 'quill-delta'

import Editor from '@/components/editor/Editor'
import { Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { projectStore } from '@/stores/projectStore'
import { useStore } from '@nanostores/preact'

// document is a higher-order component that manages the doc object
export default ({ projectId, filename }: { projectId?: string; filename?: string }) => {
  const project = useStore(projectStore.projectMap)[projectId!]
  const contents = useStore(docStore.document)

  useEffect(() => {
    if (project?.id && projectId && project.id != projectId) {
      projectStore.setCurrentProject(projectId)
    } else if (project && filename) {
      docStore.loadDoc(project, filename)
    }
  }, [project, projectId, filename])

  const saveContents = (project: Project, filename: string, contents: Delta) => {
    docStore.saveDoc(project, filename, contents)
  }

  if (!project) return null

  return (
    <Editor project={project} filename={filename} contents={contents} saveContents={saveContents} />
  )
}
