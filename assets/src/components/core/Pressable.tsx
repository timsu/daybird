import { RenderableProps } from 'preact'

import Tooltip, { TooltipProps } from '@/components/core/Tooltip'

export default ({
  tooltip,
  onClick,
  children,
}: RenderableProps<{
  tooltip?: string | TooltipProps
  tooltipWidth?: number
  onClick: (e: MouseEvent) => void
}>) => {
  const contents = (
    <div
      className="relative flex flex-col items-center group p-1 hover:bg-gray-500/50 rounded cursor-pointer print:hidden"
      onClick={onClick}
    >
      {children}
    </div>
  )
  if (!tooltip) return contents
  const tooltipProps: TooltipProps = typeof tooltip == 'string' ? { message: tooltip } : tooltip
  return <Tooltip {...tooltipProps}>{contents}</Tooltip>
}
