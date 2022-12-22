import AppleIcon from '@/components/auth/AppleIcon'
import GoogleIcon from '@/components/auth/GoogleIcon'
import GoogleServerOAuth, {
    GoogleResponse, PROFILE_SCOPES
} from '@/components/auth/GoogleServerOAuth'
import InsightLoginButton from '@/components/core/InsightLoginButton'
import Loader from '@/components/core/Loader'
import { OAuthProvider } from '@/config'
import useReactNativeSignin from '@/screens/auth/useReactNativeSignin'
import { authStore } from '@/stores/authStore'
import { uiStore } from '@/stores/uiStore'
import { useStore } from '@nanostores/preact'

type Props = {
  verb: string
  onGoogleSignin: (response: GoogleResponse) => Promise<void>
}

export default function ({ verb, onGoogleSignin }: Props) {
  useReactNativeSignin()

  const oAuthSubmitting = useStore(authStore.oAuthSubmitting)

  const GoogleButton = (props: JSX.HTMLAttributes<HTMLButtonElement>) => (
    <InsightLoginButton {...props} className="bg-[#4285F4] hover:bg-[#3367d6] pl-0">
      {oAuthSubmitting == OAuthProvider.GOOGLE ? (
        <Loader class="mr-2" />
      ) : (
        <GoogleIcon size={40} class="mr-2 -my-4" />
      )}
      {verb} with Google
    </InsightLoginButton>
  )

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex justify-center text-xs my-4">
        <span className="px-2 bg-white text-gray-500">OR</span>
      </div>

      {uiStore.reactNative ? (
        <GoogleButton
          disabled={oAuthSubmitting == OAuthProvider.GOOGLE}
          onClick={() => window.ReactNativeWebView?.postMessage('login:google')}
        />
      ) : (
        <GoogleServerOAuth
          desc="Sign in with Google"
          scope={PROFILE_SCOPES}
          onSuccess={onGoogleSignin}
          button={<GoogleButton />}
        />
      )}

      <div class="h-4" />

      {uiStore.reactNative && (
        <InsightLoginButton
          className="bg-black hover:bg-gray-800"
          disabled={oAuthSubmitting == OAuthProvider.APPLE}
          onClick={() => window.ReactNativeWebView?.postMessage('login:apple')}
        >
          {oAuthSubmitting == OAuthProvider.APPLE ? (
            <Loader class="mr-2" />
          ) : (
            <AppleIcon class="mr-2" />
          )}
          {verb} with Apple
        </InsightLoginButton>
      )}
    </div>
  )
}
