import { useEffect } from 'preact/hooks'

type Props = {
  title: string
}
export default (props: Props) => {
  useEffect(() => {
    document.title = props.title
  })
  return null
}
