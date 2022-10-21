import { format } from 'date-fns'
import { useEffect } from 'preact/hooks'

import GoogleServerOAuth, {
    CALENDAR_SCOPES, GoogleResponse, PROFILE_SCOPES
} from '@/components/auth/GoogleServerOAuth'
import Loader from '@/components/core/Loader'
import { authStore } from '@/stores/authStore'
import { calendarStore } from '@/stores/calendarStore'
import { logger } from '@/utils'
import { useStore } from '@nanostores/preact'

type Props = { date: Date }

export default function DayView({ date }: Props) {
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

      {tokens && tokens.length > 0 && <Events date={date} />}
    </div>
  )
}

function Events({ date }: Props) {
  const tokens = useStore(calendarStore.tokens)
  const loading = useStore(calendarStore.loading)

  useEffect(() => {
    calendarStore.fetchCalendars()
  }, [tokens?.length])

  if (loading)
    return (
      <div class="flex justify-center my-4">
        <Loader />
      </div>
    )

  return <div class="p-3">events</div>
}
