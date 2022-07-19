import Document from '@/components/editor/Document'

type Props = {
  path: string
  filename?: string
}
export default (props: Props) => (
  <div class="grow bg-white h-full w-full">
    <Document filename={props.filename} />
  </div>
)
