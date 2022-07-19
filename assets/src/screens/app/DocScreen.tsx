import Document from '@/components/editor/Document'

type Props = {
  path: string
  projectId?: string
  filename?: string
}
export default (props: Props) => {
  return (
    <div class="grow bg-white h-full w-full">
      <Document projectId={props.projectId} filename={props.filename} />
    </div>
  )
}
