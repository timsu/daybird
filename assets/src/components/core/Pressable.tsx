import { RenderableProps } from 'preact'

export default ({
  tooltip,
  tooltipWidth,
  onClick,
  children,
}: RenderableProps<{
  tooltip?: string
  tooltipWidth?: number
  onClick: (e: MouseEvent) => void
}>) => {
  return (
    <div
      className="relative flex flex-col items-center group p-1 hover:bg-gray-500/50 rounded cursor-pointer"
      onClick={onClick}
    >
      {children}
      {tooltip && (
        <div
          className="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex"
          style={{ minWidth: tooltipWidth || 75 }}
        >
          <span
            className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap
            font-normal bg-black shadow-lg rounded-md"
          >
            {tooltip}
          </span>
          <div className="w-3 h-3 -mt-2 rotate-45 bg-black"></div>
        </div>
      )}
    </div>
  )
}