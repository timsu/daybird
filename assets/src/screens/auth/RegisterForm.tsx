import { useState } from 'preact/hooks'

import GoogleServerOAuth, {
  GoogleResponse,
  PROFILE_SCOPES,
} from '@/components/auth/GoogleServerOAuth'
import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Pressable from '@/components/core/Pressable'
import Submit from '@/components/core/Submit'
import { config, OAuthProvider, paths } from '@/config'
import AuthForm from '@/screens/auth/AuthForm'
import { authStore } from '@/stores/authStore'
import { uiStore } from '@/stores/uiStore'
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
    if (!email.includes('@')) return setError('Email is invalid')
    if (password.length < 6) return setError('Password needs to be at least 6 characters')

    try {
      setSubmitting(true)
      await authStore.createAccount(name, email, password)
    } catch (e) {
      setError(unwrapError(e, false, "We're so sorry, there was an error creating the account."))
    } finally {
      setSubmitting(false)
    }
  }

  const signUpGoogle = async (response: GoogleResponse) => {
    try {
      setSubmitting(true)
      await authStore.logInElseSignUpOAuth(OAuthProvider.GOOGLE, response.id_token!)
    } catch (e) {
      setError(unwrapError(e, false, "We're so sorry, there was an error creating the account."))
    } finally {
      setSubmitting(false)
    }
  }

  const randomUser = () => {
    authStore.createAccount(
      Math.random().toString(36),
      Math.random().toString(36) + '@random.com',
      'test12'
    )
  }

  return (
    <AuthForm
      title={`Welcome to ${
        uiStore.insightLoop ? 'InsightLoop' : uiStore.addie ? 'Addie' : 'Daybird'
      }`}
    >
      {!uiStore.reactNative && (
        <>
          <div className="flex justify-center">
            <GoogleServerOAuth
              desc="Sign up with Google"
              scope={PROFILE_SCOPES}
              onSuccess={signUpGoogle}
            />
          </div>

          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
          </div>
        </>
      )}

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

        <Submit label="Create account" disabled={submitting} />

        <ErrorMessage error={error} />

        <div className="mt-4 flex justify-center">
          <a href={paths.SIGNIN + location.search} className="text-lavender-400 text-sm">
            Already have an account?
          </a>
        </div>

        {config.dev && (
          <Pressable onClick={randomUser} className="mt-4 flex justify-center">
            create a random user
          </Pressable>
        )}
      </form>
    </AuthForm>
  )
}
