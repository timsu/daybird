import { JSX, RenderableProps } from 'preact'

type Props = JSX.HTMLAttributes

export default ({ children, ...rest }: RenderableProps<Props>) => (
  <button
    {...rest}
    type="button"
    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm
          font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    {children}
  </button>
)
