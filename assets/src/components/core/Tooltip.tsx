import { RenderableProps } from 'preact'
import { useState } from 'preact/hooks'

type Placement = 'left' | 'right' | 'top'

export type TooltipProps = {
  class?: string
  placement?: Placement
  width?: number
  message: string
}

export default ({
  class: cls,
  message,
  children,
  width = 75,
  placement = 'top',
}: RenderableProps<TooltipProps>) => {
  const [open, setOpen] = useState(false)

  const positioning =
    placement == 'right' ? 'left-full ml-6' : placement == 'left' ? 'right-0 mr-6' : 'bottom-0 mb-5'

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={`relative ${cls || ''} group`}
    >
      {open && (
        <div
          className={`absolute z-10 ${positioning} flex-col items-center group-hover:flex pointer-events-none`}
          style={{ width }}
        >
          <span
            className="relative p-2 text-xs leading-none text-white whitespace-no-wrap
            font-normal bg-black shadow-lg rounded-md"
          >
            {message}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}
