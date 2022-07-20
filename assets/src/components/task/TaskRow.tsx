import { useState } from 'preact/hooks'

type Props = {
  id: string
  focus?: boolean
}

export default ({ focus }: Props) => {
  const [title, setTitle] = useState('')
  const onSubmit = (e: Event) => {
    e.preventDefault()
  }

  return (
    <form onSubmit={onSubmit}>
      <div contentEditable={false} class="bg-gray-100 rounded p-4 flex flex-row items-center">
        <input type="checkbox" class="mr-2 rounded border-gray-400" />

        <input
          type="text"
          class="text-lg rounded px-1 py-0 bg-transparent border-none flex-grow"
          value={title}
          placeholder="What would you like to do?"
          onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
          ref={(elem) => focus && setTimeout(() => elem?.focus(), 100)}
        />
      </div>
    </form>
  )
}
