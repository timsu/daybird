import { useState } from 'preact/hooks'

import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import AuthForm from '@/screens/auth/AuthForm'
import { authStore } from '@/stores/authStore'
import { unwrapError } from '@/utils'

export default () => {
  const [remember, setRemember] = useState(true)
  const [email, setEmail] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [error, setError] = useState<string>()

  const onSubmit = (e: Event) => {
    e.preventDefault()
    if (!email) return setError('Email is required')
    if (!password) return setError('Password is required')

    authStore.signIn(email, password).catch((e) => setError(unwrapError(e)))
  }

  return (
    <AuthForm title="Sign in to your account">
      <form className="space-y-6" action="#" method="POST" onSubmit={onSubmit}>
        <Input
          id="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
        />

        <Input
          id="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={remember}
              onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          {/* <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                  </a>
                </div> */}
        </div>

        <Submit label="Sign in" />

        <ErrorMessage error={error} />
      </form>

      {/* <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
      </div> */}
    </AuthForm>
  )
}