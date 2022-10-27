import { RenderableProps } from 'preact'
import { twMerge } from 'tailwind-merge'

import Tooltip, { TooltipProps } from '@/components/core/Tooltip'

export default ({
  tooltip,
  className,
  onClick,
  children,
}: RenderableProps<{
  className?: string
  tooltip?: string | TooltipProps
  tooltipWidth?: number
  onClick: (e: MouseEvent) => void
}>) => {
  const contents = (
    <div
      className={twMerge(
        'relative flex flex-col items-center group p-1 rounded cursor-pointer print:hidden hover:bg-gray-400/50',
        className || ''
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
  if (!tooltip) return contents
  const tooltipProps: TooltipProps =
    typeof tooltip == 'string' ? { message: tooltip, class: className } : tooltip
  return <Tooltip {...tooltipProps}>{contents}</Tooltip>
}
