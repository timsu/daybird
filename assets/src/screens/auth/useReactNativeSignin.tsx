import { useEffect } from 'preact/hooks'
import { toast } from 'react-hot-toast'

import { OAuthProvider } from '@/config'
import { authStore } from '@/stores/authStore'
import { unwrapError } from '@/utils'

type ErrorPayload = {
  error: string
}

type ValidPayload = {
  id: string
  provider: OAuthProvider
  code: string
  name?: string
  email?: string
}

type Payload = ErrorPayload | ValidPayload

export default function () {
  useEffect(() => {
    if (authStore.debugMode()) (window as any)['authStore'] = authStore

    window.addEventListener(
      'message',
      (event) => {
        const message = event.data
        if (!message) return
        if (message.startsWith('didlogin:')) {
          const payloadText = message.substring(9)
          const payload = JSON.parse(payloadText) as Payload

          if (isErrorPayload(payload)) toast.error(payload.error)
          else {
            authStore
              .logInElseSignUpOAuth(payload.provider, payload.code)
              .catch((e) => toast.error(unwrapError(e)))
          }
        }
      },
      false
    )
  }, [])
}

export const isErrorPayload = (item: Payload): item is ErrorPayload =>
  !!(item as ErrorPayload).error
