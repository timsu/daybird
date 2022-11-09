import { CommandListComponentProps } from '@/components/slashmenu/CommandListController'
import { CommandItem } from '@/components/slashmenu/commands'

export type CommandListProps = {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export default function ({ items, selectedIndex, selectItem }: CommandListComponentProps) {
  console.log('rendarr', items)

  return (
    <div class="shadow rounded bg-white flex flex-col w-52">
      {items.map((item, index) => {
        return (
          <button
            className={`text-left p-2 hover:bg-gray-400 ${
              index === selectedIndex ? 'bg-gray-300' : ''
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.title}
          </button>
        )
      })}
    </div>
  )
}
