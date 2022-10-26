import { Ref } from 'preact'
import { StateUpdater } from 'preact/hooks'
import { twMerge } from 'tailwind-merge'

import { debounce, DebounceStyle } from '@/utils'

type Props = {
  label: string
  className?: string
  forwardRef?: Ref<HTMLInputElement>
  setChecked: StateUpdater<boolean>
} & JSX.HTMLAttributes<HTMLInputElement>

export default function ({ className, label, setChecked, ...rest }: Props) {
  return (
    <div
      className={twMerge('flex items-center hover:bg-gray-100 rounded-md', className || '')}
      onClick={() => setChecked((s) => !s)}
    >
      <input
        type="checkbox"
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        onChange={(e) => setChecked((e.target as HTMLInputElement).checked)}
        {...rest}
      />
      <div className="ml-2 block text-sm text-gray-900 select-none cursor-pointer">{label}</div>
    </div>
  )
}
