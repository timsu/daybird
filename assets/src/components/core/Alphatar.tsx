import { lightColorFor } from '@/utils'

export type AlphatarProps = {
  id: string
  text: string
}

type Props = AlphatarProps

export default function (props: Props) {
  const { text } = props
  if (!text) return null

  const color = lightColorFor(props.id)

  const letters = text
    .split(' ', 2)
    .map((s) => s.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
      style={{ background: color }}
    >
      <span className="text-sm font-medium leading-none text-black">{letters}</span>
    </span>
  )
}
