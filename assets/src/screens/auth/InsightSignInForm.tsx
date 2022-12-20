import { useState } from 'preact/hooks'

import AppleIcon from '@/components/auth/AppleIcon'
import GoogleIcon from '@/components/auth/GoogleIcon'
import GoogleServerOAuth, {
    GoogleResponse, PROFILE_SCOPES
} from '@/components/auth/GoogleServerOAuth'
import Checkbox from '@/components/core/Checkbox'
import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import InsightInput from '@/components/core/InsightInput'
import InsightLoginButton from '@/components/core/InsightLoginButton'
import Submit from '@/components/core/Submit'
import { OAuthProvider, paths } from '@/config'
import AuthForm from '@/screens/auth/AuthForm'
import { authStore } from '@/stores/authStore'
import { uiStore } from '@/stores/uiStore'
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
      setError(unwrapError(e, false, 'There was an error signing in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const signInGoogle = async (response: GoogleResponse) => {
    try {
      setSubmitting(true)
      await authStore.logInElseSignUpOAuth(OAuthProvider.GOOGLE, response.id_token!)
    } catch (e) {
      setError(unwrapError(e, false, 'There was an error signing in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const GoogleButton = (props: JSX.HTMLAttributes<HTMLButtonElement>) => (
    <InsightLoginButton {...props} className="bg-[#4285F4] hover:bg-[#3367d6] pl-0">
      <GoogleIcon size={40} class="mr-2 -my-4" />
      Sign in with Google
    </InsightLoginButton>
  )

  return (
    <div className="min-h-full flex flex-col p-8">
      <h2 className="text-2xl text-gray-900 font-medium">Welcome back</h2>
      <h3 className="text-sm text-gray-700">Sign in with your account</h3>

      <div class="h-4" />

      <form className="space-y-6" action="#" method="POST" onSubmit={onSubmit}>
        <InsightInput
          id="email"
          type="email"
          label="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
        />

        {email && (
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

        <div className="flex flex-col items-center">
          {email && (
            <InsightLoginButton
              type="submit"
              disabled={submitting}
              className="bg-inblue-500 hover:bg-inblue-700"
            >
              LOGIN
            </InsightLoginButton>
          )}

          <div className="relative flex justify-center text-xs my-6">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>

          {uiStore.reactNative ? (
            <GoogleButton onClick={() => window.ReactNativeWebView?.postMessage('login:google')} />
          ) : (
            <GoogleServerOAuth
              desc="Sign in with Google"
              scope={PROFILE_SCOPES}
              onSuccess={signInGoogle}
              button={<GoogleButton />}
            />
          )}

          <div class="h-4" />

          {uiStore.reactNative && (
            <InsightLoginButton
              className="bg-black hover:bg-gray-800"
              onClick={() => window.ReactNativeWebView?.postMessage('login:apple')}
            >
              <AppleIcon class="mr-2" />
              Sign in with Apple
            </InsightLoginButton>
          )}
        </div>
      </form>
    </div>
  )
}
