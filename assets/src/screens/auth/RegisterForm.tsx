import { useState } from 'preact/hooks'

import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import { config } from '@/config'
import { authStore } from '@/stores/authStore'
import { unwrapError } from '@/utils'

export default () => {
  const [name, setName] = useState<string>()
  const [email, setEmail] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [error, setError] = useState<string>()

  const onSubmit = (e: Event) => {
    e.preventDefault()
    if (!name) return setError('Name is required')
    if (!email) return setError('Email is required')
    if (!password) return setError('Password is required')
    if (!email.includes('@')) setError('Email is invalid')
    if (!config.dev && password.length < 6) setError('Password needs to be at least 6 characters')

    authStore.createAccount(name, email, password).catch((e) => setError(unwrapError(e)))
  }

  return (
    <>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" action="#" method="POST" onSubmit={onSubmit}>
              <Input
                id="name"
                type="text"
                label="Name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
              />

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              />

              <Submit label="Create account" />

              {error && <div className="mt-6 text-red-600 bold">{error}</div>}
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
          </div>
        </div>
      </div>
    </>
  )
}
