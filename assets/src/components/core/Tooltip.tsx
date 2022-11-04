import { RenderableProps } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

import { classNames } from '@/utils'
import { createPopper, Placement } from '@popperjs/core'

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
  const divRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    createPopper(divRef.current!, tooltipRef.current!, {
      placement,
    })
  }, [])

  return (
    <>
      <div ref={divRef} className={classNames('flex group', cls || 'flex-row items-center')}>
        {message && (
          <div
            ref={tooltipRef}
            role="tooltip"
            className={classNames(
              'p-2 text-xs leading-none text-white transition-opacity pointer-events-none',
              'font-normal bg-black shadow-lg rounded-md z-50',
              'opacity-0 absolute left-[-9999px] group-hover:opacity-100 group-hover:left-0',
              tooltipClass || ''
            )}
          >
            {message}
          </div>
        )}
        {children}
      </div>
    </>
  )
}
