import { format } from 'date-fns'
import { useEffect } from 'preact/hooks'

import GoogleServerOAuth, {
    CALENDAR_SCOPES, GoogleResponse
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
    logger.info(response)
  }

  return (
    <div>
      <div class="font-bold px-2">{format(date, 'MMMM do')}</div>

      {tokens != undefined && tokens.length == 0 && (
        <div class="p-2 flex flex-col items-center">
          <div class="py-6 italic text-gray-400">No calendar connected.</div>

          <GoogleServerOAuth
            desc="Connect"
            scope={CALENDAR_SCOPES}
            email={user?.email}
            onSuccess={onConnect}
          />
        </div>
      )}

      {tokens && tokens.length > 0 && <div>tokens</div>}
    </div>
  )
}
