import { CommandListComponentProps } from '@/components/slashmenu/CommandListController'
import { CommandItem } from '@/components/slashmenu/SlashExtension'

export type CommandListProps = {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export default function ({ items, selectedIndex, selectItem }: CommandListComponentProps) {
  return (
    <div class="shadow rounded bg-white flex flex-col w-52">
      {items.map((item, index) => {
        return (
          <button
            className={`text-left p-2 hover:bg-gray-400 flex ${
              index === selectedIndex ? 'bg-gray-300' : ''
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div class="flex-1">{item.title}</div>
            {item.shortcut && <div class="opacity-50">{item.shortcut}</div>}
          </button>
        )
      })}
    </div>
  )
}
