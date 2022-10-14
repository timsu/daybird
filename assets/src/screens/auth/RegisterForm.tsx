import { useState } from 'preact/hooks'

import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import { paths } from '@/config'
import AuthForm from '@/screens/auth/AuthForm'
import { authStore } from '@/stores/authStore'
import { unwrapError } from '@/utils'

export default () => {
  const [name, setName] = useState<string>()
  const [email, setEmail] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)

  const onSubmit = async (e: Event) => {
    e.preventDefault()
    if (!name) return setError('Name is required')
    if (!email) return setError('Email is required')
    if (!password) return setError('Password is required')
    if (!email.includes('@')) setError('Email is invalid')
    if (password.length < 6) setError('Password needs to be at least 6 characters')

    try {
      setSubmitting(true)
      await authStore.createAccount(name, email, password)
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthForm title="Create an account">
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

        <ErrorMessage error={error} />

        <div className="mt-4 flex justify-center">
          <a href={paths.SIGNIN} className="text-lavender-400 text-sm">
            Meant to sign in?
          </a>
        </div>
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
