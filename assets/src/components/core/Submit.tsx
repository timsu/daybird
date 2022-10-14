type Props = {
  label: string
} & JSX.HTMLAttributes<HTMLButtonElement>

export default ({ label, ...rest }: Props) => (
  <button
    type="submit"
    {...rest}
    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md
  shadow-sm text-sm font-medium text-white bg-lavender-600 hover:bg-lavender-700
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    {label}
  </button>
)
