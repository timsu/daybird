import { useEffect, useState } from 'preact/hooks'

import { API } from '@/api'
import MiniEditor from '@/components/editor/MiniEditor'
import { Period, Project } from '@/models'

type Props = { project: Project; id: string }

// document is a higher-order component that manages the doc object
export default ({ project, id }: Props) => {
  const [contents, setContents] = useState<any>()

  useEffect(() => {
    API.readFile(project, id).then(setContents)
  }, [project, id])

  if (!contents === undefined) return null

  return (
    <MiniEditor
      className="max-h-[8rem] overflow-y-scroll"
      project={project}
      id={id}
      contents={contents}
      readOnly
    />
  )
}
