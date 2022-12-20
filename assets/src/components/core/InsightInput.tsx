import { Ref } from 'preact'
import { twMerge } from 'tailwind-merge'

type Props = {
  label: string
  labelClassName?: string
  forwardRef?: Ref<HTMLInputElement>
} & JSX.HTMLAttributes<HTMLInputElement>

export default (props: Props) => {
  const { label, labelClassName, className, forwardRef, ...rest } = props
  return (
    <div className="mb-2">
      {label && (
        <label
          htmlFor={props.id}
          className={twMerge('block text-sm text-gray-700', labelClassName)}
        >
          {label}
        </label>
      )}
      <div className="mt-1">
        <input
          ref={forwardRef}
          {...rest}
          className={twMerge(
            `appearance-none block w-full px-0 py-2 border-0 border-b border-b-gray-300
             placeholder-gray-400 focus:ring-0 focus:border-blue-500 text-sm`,
            className
          )}
        />
      </div>
    </div>
  )
}
