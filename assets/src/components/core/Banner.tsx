import { RenderableProps } from 'preact'

import { XIcon } from '@heroicons/react/outline'

type Props = {
  onClose?: () => void
}

export default function ({ onClose, children }: RenderableProps<Props>) {
  return (
    <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
      <div className="pr-16 sm:text-center sm:px-16 font-medium text-white">
        {children}
        {onClose && (
          <div className="absolute inset-y-0 right-0 pt-1 pr-1 flex items-start sm:pt-1 sm:pr-2 sm:items-start">
            <button
              type="button"
              onClick={onClose}
              className="flex p-2 rounded-md hover:bg-white-500/75 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span className="sr-only">Dismiss</span>
              <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
