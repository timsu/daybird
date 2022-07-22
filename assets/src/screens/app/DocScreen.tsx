import Helmet from '@/components/core/Helmet'
import Document from '@/components/editor/Document'
import { DOC_EXT } from '@/stores/fileStore'

type Props = {
  path: string
  projectId?: string
  filename?: string
}
export default (props: Props) => {
  const title = props.filename
    ? props.filename.substring(props.filename.lastIndexOf('/')).replace(DOC_EXT, '')
    : ''
  return (
    <>
      <Helmet title={title} />
      <div class="grow bg-white h-full w-full">
        <Document projectId={props.projectId} filename={props.filename} />
      </div>
    </>
  )
}
