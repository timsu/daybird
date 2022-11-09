import { forwardRef } from 'preact/compat'
import { useCallback, useImperativeHandle, useState } from 'preact/hooks'

import { Editor, Range } from '@tiptap/core'

export type CommandItem = {
  title: string
  shortcut?: string
  command: (args: { editor: Editor; range: Range }) => void
}

export type CommandListProps = {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export default forwardRef<HTMLDivElement, CommandListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelected] = useState(0)

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index]
      if (item) command(item)
    },
    [items]
  )

  useImperativeHandle(
    ref,
    () =>
      ({
        onKeyDown(event: KeyboardEvent) {
          if (event.key === 'ArrowUp') {
            setSelected((s) => (s + items.length - 1) % items.length)
            return true
          }

          if (event.key === 'ArrowDown') {
            setSelected((s) => (s + 1) % items.length)
            return true
          }

          if (event.key === 'Enter') {
            setSelected((s) => {
              selectItem(s)
              return s
            })
            return true
          }

          return false
        },
      } as any),
    [items]
  )

  return (
    <div className="items">
      {items.map((item, index) => {
        return (
          <button
            className={`p-2 hover:bg-gray-400 ${index === selectedIndex ? 'bg-gray-300' : ''}`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.title}
          </button>
        )
      })}
    </div>
  )
})
