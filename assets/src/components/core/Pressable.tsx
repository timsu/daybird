import { RenderableProps } from 'preact'

import Tooltip, { TooltipProps } from '@/components/core/Tooltip'
import { classNames } from '@/utils'

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
      className={classNames(
        'relative flex flex-col items-center group p-1 rounded cursor-pointer print:hidden',
        className || 'hover:bg-gray-400/50'
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
