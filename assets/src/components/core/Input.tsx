import { Ref } from 'preact'

type Props = {
  label: string
  forwardRef: Ref<HTMLInputElement>
} & JSX.HTMLAttributes<HTMLInputElement>

export default (props: Props) => {
  const { label, forwardRef, ...rest } = props
  return (
    <div className="mb-2">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="mt-1">
        <input
          ref={forwardRef}
          {...rest}
          className="appearance-none block w-full px-3 py-2 border border-gray-300
                      rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500
                      focus:border-blue-500 sm:text-sm"
        />
      </div>
    </div>
  )
}
