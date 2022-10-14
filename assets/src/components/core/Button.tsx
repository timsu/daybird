import { JSX, RenderableProps } from 'preact'

import { classNames } from '@/utils'

type Props = JSX.HTMLAttributes

export default ({ children, class: cls, className, ...rest }: RenderableProps<Props>) => (
  <button
    type="button"
    class={classNames(
      'inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm',
      'font-medium rounded-md text-white bg-lavender-600 hover:bg-lavender-700 focus:outline-none',
      'focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      cls!,
      className!
    )}
    {...rest}
  >
    {children}
  </button>
)
