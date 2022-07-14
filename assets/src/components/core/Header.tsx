import Button from '@/components/core/Button'
import Logo from '@/components/core/Logo'
import { paths } from '@/config'
import { authStore } from '@/stores/authStore'

export default function () {
  const loggedIn = authStore.hasToken()
  return (
    <div className="bg-white flex justify-between items-center px-4 py-6 sm:px-6 md:justify-start md:space-x-10">
      <div>
        <a href={paths.ROOT} className="flex">
          <span className="sr-only">Sequence</span>
          <Logo />
        </a>
      </div>

      <div className="grow" />

      <div className="flex items-center md:ml-12">
        {loggedIn ? (
          <>
            <Button href={paths.APP}>Go to app</Button>
          </>
        ) : (
          <>
            <a
              href={paths.SIGNIN}
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Sign in
            </a>
            <Button href={paths.SIGNUP}>Sign up</Button>
          </>
        )}
      </div>
    </div>
  )
}
