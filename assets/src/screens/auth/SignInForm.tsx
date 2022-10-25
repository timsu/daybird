import { useState } from 'preact/hooks'

import GoogleServerOAuth, {
    GoogleResponse, PROFILE_SCOPES
} from '@/components/auth/GoogleServerOAuth'
import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import { OAuthProvider, paths } from '@/config'
import AuthForm from '@/screens/auth/AuthForm'
import { authStore } from '@/stores/authStore'
import { unwrapError } from '@/utils'

export default () => {
  const [remember, setRemember] = useState(true)
  const [email, setEmail] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)

  const onSubmit = async (e: Event) => {
    e.preventDefault()

    // read directly from elements due to password manager auto-fill
    const email = (document.querySelector('#email') as HTMLInputElement).value
    const password = (document.querySelector('#password') as HTMLInputElement).value
    if (!email) return setError('Email is required')
    if (!password) return setError('Password is required')

    try {
      setSubmitting(true)
      await authStore.signIn(email, password)
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const signInGoogle = async (response: GoogleResponse) => {
    try {
      setSubmitting(true)
      await authStore.logInElseSignUpOAuth(OAuthProvider.GOOGLE, response.id_token!)
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
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

        <Submit label="Sign in" disabled={submitting} />

        <ErrorMessage error={error} />

        <div className="mt-4 flex justify-center">
          <a href={paths.SIGNUP} className="text-lavender-400 text-sm">
            No account? Create one.
          </a>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <GoogleServerOAuth
          desc="Sign in with Google"
          scope={PROFILE_SCOPES}
          onSuccess={signInGoogle}
        />
      </div>
    </AuthForm>
  )
}
