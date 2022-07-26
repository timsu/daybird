import { JSX, RenderableProps } from 'preact'

import { classNames } from '@/utils'

type Props = JSX.HTMLAttributes

export default ({ children, class: cls, className, ...rest }: RenderableProps<Props>) => (
  <button
    type="button"
    class={classNames(
      'inline-flex items-center px-4 py-2 border-2 border-red-600 text-red-600 shadow-sm text-sm',
      'font-medium rounded-md hover:text-white hover:bg-red-600 focus:ring-red-500',
      cls!,
      className!
    )}
    {...rest}
  >
    {children}
  </button>
)
