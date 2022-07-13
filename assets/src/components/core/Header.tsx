import Logo from '@/components/core/Logo'
import paths from '@/config/paths'

export default function () {
  return (
    <div className="flex justify-between items-center px-4 py-6 sm:px-6 md:justify-start md:space-x-10">
      <div>
        <a href={paths.ROOT} className="flex">
          <span className="sr-only">Sequence</span>
          <Logo />
        </a>
      </div>

      <div className="grow" />

      <div className="flex items-center md:ml-12">
        <a href={paths.SIGNIN} className="text-base font-medium text-gray-500 hover:text-gray-900">
          Sign in
        </a>
        <a
          href={paths.SIGNUP}
          className="ml-8 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Sign up
        </a>
      </div>
    </div>
  )
}
