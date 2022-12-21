import { useState } from 'preact/hooks'

import { GoogleResponse } from '@/components/auth/GoogleServerOAuth'
import ErrorMessage from '@/components/core/ErrorMessage'
import InsightInput from '@/components/core/InsightInput'
import InsightLoginButton from '@/components/core/InsightLoginButton'
import { OAuthProvider } from '@/config'
import InsightOAuth from '@/screens/auth/InsightOAuth'
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

  return (
    <div className="min-h-full flex flex-col p-8">
      <h2 className="text-2xl text-gray-900 font-medium">Hello there</h2>
      <h3 className="text-sm text-gray-700">Create an account to get started</h3>

      <div class="h-4" />

      <form className="space-y-6" action="#" method="POST" onSubmit={onSubmit}>
        <InsightInput
          id="name"
          type="text"
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName((e.target as HTMLInputElement).value)}
        />

        <InsightInput
          id="email"
          type="email"
          label="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
        />

        {name && (
          <InsightInput
            id="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
          />
        )}

        <ErrorMessage error={error} />

        {name && (
          <InsightLoginButton
            type="submit"
            disabled={submitting}
            className="bg-inblue-500 hover:bg-inblue-700 mx-auto"
          >
            SIGN UP
          </InsightLoginButton>
        )}
      </form>

      <InsightOAuth verb="Sign up" onGoogleSignin={signUpGoogle} />
    </div>
  )
}
