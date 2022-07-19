import { RenderableProps } from 'preact'

export default ({
  message,
  children,
}: RenderableProps<{
  message: string
}>) => {
  return (
    <div className="relative flex flex-col items-center group">
      {children}
      <div className="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex min-w-[75px]">
        <span
          className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap
            font-normal bg-black shadow-lg rounded-md"
        >
          {message}
        </span>
        <div className="w-3 h-3 -mt-2 rotate-45 bg-black"></div>
      </div>
    </div>
  )
}
