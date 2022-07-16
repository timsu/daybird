import Editor from '@/components/editor/Editor'

type Props = {
  path: string
  filename?: string
}
export default (props: Props) => (
  <div class="grow bg-white h-full w-full">
    <Editor filename={props.filename} />
  </div>
)
