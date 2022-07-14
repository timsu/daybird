import { RenderableProps } from 'preact'

type Props = {
  onClick: (e: MouseEvent) => void
}

export default (props: RenderableProps<Props>) => (
  <button
    type="button"
    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm
          font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    onClick={props.onClick}
  >
    {props.children}
  </button>
)
