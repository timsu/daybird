import { format } from 'date-fns'

import GoogleServerOAuth, {
    CALENDAR_SCOPES, GoogleResponse
} from '@/components/auth/GoogleServerOAuth'
import { authStore } from '@/stores/authStore'
import { logger } from '@/utils'

export default function DayView({ date }: { date: Date }) {
  const user = authStore.loggedInUser.get()

  const onConnect = async (response: GoogleResponse) => {
    logger.info(response)
  }

  return (
    <div>
      <div class="font-bold px-2">{format(date, 'MMMM do')}</div>

      <div class="p-2 flex flex-col items-center">
        <div class="py-6 italic text-gray-400">No calendar connected.</div>

        <GoogleServerOAuth
          desc="Connect"
          scope={CALENDAR_SCOPES}
          email={user?.email}
          onSuccess={onConnect}
        />
      </div>
    </div>
  )
}
