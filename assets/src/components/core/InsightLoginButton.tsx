import { RenderableProps } from 'preact'
import { twMerge } from 'tailwind-merge'

type Props = {
  className?: string
} & JSX.HTMLAttributes<HTMLButtonElement>

export default ({ className, children, ...rest }: RenderableProps<Props>) => (
  <button
    {...rest}
    className={twMerge(
      `w-[220px] flex justify-center py-3 px-4 border border-transparent rounded-md
       font-medium text-white text-sm items-center`,
      className
    )}
  >
    {children}
  </button>
)
