import { JSX } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { twMerge } from 'tailwind-merge'

import GoogleIcon from '@/components/auth/GoogleIcon'
import Button from '@/components/core/Button'
import ErrorMessage from '@/components/core/ErrorMessage'
import { uiStore } from '@/stores/uiStore'
import { classNames, logger, unwrapError } from '@/utils'

const SCOPE_PREFIX = 'https://www.googleapis.com/auth/'
export const CALENDAR_SCOPES = ['calendar.readonly', 'calendar.events']
export const CONTACTS_SCOPES = ['contacts.readonly']
export const DIRECTORY_SCOPES = ['directory.readonly']
export const PROFILE_SCOPES = ['userinfo.email', 'userinfo.profile']

type Props = {
  button?: JSX.Element
  buttonClass?: string
  scope: string | string[]
  desc: string
  skipToken?: boolean

  // if set, the built-in error text won't display
  onTandemAuthError?: (error: string) => void
  onGoogleAuthError?: (error: string) => void

  onSuccess: (response: GoogleResponse) => Promise<void>
  email?: string
}

export type GoogleResponse = {
  access_token: string
  expires_in: number
  scope: string
  token_type: string

  id_token?: string
  refresh_token?: string
  code?: string
}

let popup: Window | null = null

export default function GoogleServerOAuth(props: Props) {
  const {
    button,
    buttonClass,
    desc,
    onSuccess,
    onGoogleAuthError,
    onTandemAuthError,
    scope,
    skipToken,
    email,
  } = props
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const LoginButton = (p: { onClick: () => void }) => {
    if (button) {
      return <div {...p}>{button}</div>
    }

    return (
      <button
        data-testid="google"
        disabled={isRequesting}
        class={twMerge(
          'bg-[#4285F4] hover:bg-[#3367d6] inline-flex items-center shadow-sm text-sm text-white font-medium rounded',
          buttonClass || ''
        )}
        {...p}
      >
        <GoogleIcon size={40} style={{ margin: -1 }} />
        <div class="py-2 px-4">{desc}</div>
      </button>
    )
  }

  const RenderError = () => {
    if (!error) return null
    return (
      <>
        <ErrorMessage error={error} />
        {error.includes('third-party') && (
          <div>
            In Google Chrome, go to Settings, search for "Cookies", click on "Site Settings" &gt;
            Cookies and either uncheck "Block third-party cookies" or add tandem.chat under the
            "Allow" section.
          </div>
        )}
      </>
    )
  }

  const displayError = (error: string, tandemError: boolean) => {
    setIsRequesting(false)
    if (tandemError && onTandemAuthError) {
      onTandemAuthError(error)
    } else if (onGoogleAuthError) {
      onGoogleAuthError(error)
    } else {
      setError(error)
    }
  }

  const onLoginFail = (response: { error: string }) => {
    if (!response) return
    displayError(`Connect failed: ${response.error}`, false)
  }

  const onLoginSuccess = useCallback(
    async (response: GoogleResponse) => {
      logger.info('google login success', response)
      let type = []
      if (response.scope) {
        if (scopesInclude(PROFILE_SCOPES, response.scope)) {
          type.push('login')
        }
        if (scopesInclude(CALENDAR_SCOPES, response.scope)) {
          type.push('calendar')
        }
        if (scopesInclude(DIRECTORY_SCOPES, response.scope)) {
          type.push('directory')
        }
      } else {
        type = ['nil']
      }
      try {
        await onSuccess(response)
      } catch (e) {
        logger.warn('catch', e)
        displayError(unwrapError(e), true)
      } finally {
        setIsRequesting(false)
      }
    },
    [onSuccess]
  )

  const onClick = useCallback(() => {
    setError(null)
    const scopeString = typeof scope == 'string' ? scope : makeScopeString(scope)
    popup = makeGoogleOauthPopup(scopeString, skipToken, email)
    setIsRequesting(true)
  }, [])

  useEffect(() => {
    popup = null
  }, [])

  useEffect(() => {
    let interval: number = 0
    if (isRequesting) {
      interval = window.setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(interval)
          setIsRequesting(false)
        }
      }, 5000)
      return () => clearInterval(interval)
    } else if (interval) {
      clearInterval(interval)
    }
  }, [isRequesting])

  useEffect(() => {
    const messageListener = (message: MessageEvent) => {
      const data = message.data
      if (!data || data.type != 'oauth') return
      logger.info(data)

      setIsRequesting(false)
      if (data.event == 'closed') return

      if (data.error) onLoginFail(data)
      else if (data.result) onLoginSuccess(data.result)
    }

    window.addEventListener('message', messageListener)
    return () => window.removeEventListener('message', messageListener)
  }, [onLoginSuccess])

  return (
    <div>
      <LoginButton onClick={onClick} />
      <RenderError />
    </div>
  )
}

export function makeScopeString(scopes: string[]): string {
  return scopes.map((s) => `${SCOPE_PREFIX}${s}`).join(' ')
}

export function scopesInclude(expected: string[], returned: string): boolean {
  return expected
    .map((s) => {
      return returned.includes(SCOPE_PREFIX + s)
    })
    .reduce((prev, curr) => {
      return prev && curr
    })
}

export function makeGoogleOauthPopup(
  scope: string,
  skipToken: boolean = false,
  email: string | null = null
) {
  logger.debug('making oauth popup for scope', scope)
  const w = 600
  const h = 850
  const left = window.screenLeft + window.innerWidth / 2 - w / 2
  const top = window.screenTop + window.innerHeight / 2 - h / 2
  const features = `toolbar=no, menubar=no, width=${w}, height=${h}, left=${left}, top=${top}`
  const url =
    '/oauth/google?' +
    (scope ? `scope=${scope}&` : '') +
    (skipToken ? `skip_token=true&` : '') +
    (email ? `email=${encodeURIComponent(email)}` : '')
  const popup = window.open(url, 'google', features)
  return popup
}
