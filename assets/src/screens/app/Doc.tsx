import Editor from '@/components/editor/Editor'

type Props = {
  path: string
}
export default (props: Props) => (
  <div class="grow bg-white h-full w-full">
    <Editor />
  </div>
)
