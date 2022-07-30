import { RenderableProps } from 'preact'
import { useState } from 'preact/hooks'

import { classNames } from '@/utils'

type Placement = 'left' | 'right' | 'top' | 'bottom'

export type TooltipProps = {
  class?: string
  placement?: Placement
  tooltipClass?: string
  message: string
}

export default ({
  class: cls,
  tooltipClass,
  message,
  children,

  placement = 'top',
}: RenderableProps<TooltipProps>) => {
  const [open, setOpen] = useState(false)

  const positioning =
    placement == 'top'
      ? 'bottom-0 mb-5'
      : placement == 'right'
      ? 'left-full ml-6'
      : placement == 'left'
      ? 'right-0 mr-6'
      : placement == 'bottom'
      ? 'top-full mt-2'
      : ''

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={classNames('relative flex', cls || 'flex-row items-center')}
    >
      {open && (
        <div
          className={`absolute z-10 ${positioning} flex-col items-center group-hover:flex pointer-events-none`}
        >
          <div
            className={classNames(
              'relative p-2 text-xs leading-none text-white whitespace-no-wrap',
              'font-normal bg-black shadow-lg rounded-md',
              tooltipClass || ''
            )}
          >
            {message}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
