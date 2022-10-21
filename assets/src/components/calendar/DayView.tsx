import { format } from 'date-fns'
import { useEffect } from 'preact/hooks'

import GoogleServerOAuth, {
    CALENDAR_SCOPES, GoogleResponse, PROFILE_SCOPES
} from '@/components/auth/GoogleServerOAuth'
import { authStore } from '@/stores/authStore'
import { calendarStore } from '@/stores/calendarStore'
import { logger } from '@/utils'
import { useStore } from '@nanostores/preact'

export default function DayView({ date }: { date: Date }) {
  const tokens = useStore(calendarStore.tokens)
  const user = authStore.loggedInUser.get()

  useEffect(() => {
    calendarStore.init()
  }, [])

  const onConnect = async (response: GoogleResponse) => {
    calendarStore.saveGoogleOAuthToken(response)
  }

  return (
    <div>
      <div class="font-bold px-3">{format(date, 'MMMM do')}</div>

      {tokens != undefined && tokens.length == 0 && (
        <div class="p-2 flex flex-col items-center text-center text-sm">
          <div class="py-6 italic text-gray-400">No calendar connected.</div>

          <GoogleServerOAuth
            desc="Connect"
            scope={[...PROFILE_SCOPES, ...CALENDAR_SCOPES]}
            email={user?.email}
            onSuccess={onConnect}
            skipToken
          />

          <div class="py-6 italic text-gray-400">
            Note that this feature is in testing, please reach out to tim@daybird.app to be added to
            the list.
          </div>
        </div>
      )}

      {tokens && tokens.length > 0 && <div>tokens</div>}
    </div>
  )
}
