import { format, getHours } from 'date-fns'
import { flatten } from 'lodash'
import { useEffect } from 'preact/hooks'

import GoogleServerOAuth, {
    CALENDAR_SCOPES, GoogleResponse, PROFILE_SCOPES
} from '@/components/auth/GoogleServerOAuth'
import Loader from '@/components/core/Loader'
import { GEvent } from '@/config'
import { authStore } from '@/stores/authStore'
import { calendarStore } from '@/stores/calendarStore'
import { uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'
import { CheckIcon } from '@heroicons/react/outline'
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
    <div class="flex-1 flex flex-col">
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

      {tokens && tokens.length > 0 && <CalendarView date={date} />}
    </div>
  )
}

function CalendarView({ date }: Props) {
  const tokens = useStore(calendarStore.tokens)
  const loading = useStore(calendarStore.loading)

  useEffect(() => {
    calendarStore.fetchCalendars()
  }, [tokens?.length])

  useEffect(() => {
    calendarStore.fetchEvents(date)
  }, [date])

  if (loading)
    return (
      <div class="flex justify-center my-4">
        <Loader />
      </div>
    )

  return (
    <div class="flex-1 flex flex-col">
      <Events />

      <Calendars />
    </div>
  )
}

type Event = {
  source: GEvent
  start: Date
  end: Date
}

function Events() {
  const events = useStore(calendarStore.events)

  const eventList = flatten(Object.values(events))

  const allDayEvents = eventList.filter((e) => e.start.date)

  const regularEvents: Event[] = eventList
    .filter((e) => e.start.dateTime)
    .map((e) => ({
      source: e,
      start: new Date(e.start.dateTime!),
      end: new Date(e.end.dateTime!),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const timeString = (e: Event) => {
    const startAM = getHours(e.start) < 12
    const endAM = getHours(e.end) < 12

    if (startAM == endAM) return `${format(e.start, 'h:mm')} - ${format(e.end, 'h:mm aaa')}`
    return `${format(e.start, 'H:mm aaa')} - ${format(e.end, 'H:mm aaa')}`
  }

  return (
    <div class="overflow-scroll flex-1 px-3 py-1 text-sm">
      {allDayEvents.length > 0 && (
        <div class="mb-4">
          <div class="font-semibold">All Day</div>
          {allDayEvents.map((e) => (
            <div>
              <span>{e.summary}</span>
            </div>
          ))}
        </div>
      )}

      {regularEvents.map((e) => (
        <div class="mb-2">
          <div class="font-semibold">{timeString(e)}</div>
          <span>{e.source.summary}</span>
        </div>
      ))}
    </div>
  )
}

function Calendars() {
  const calendars = useStore(calendarStore.calendars)
  const enabled = useStore(calendarStore.calendarsEnabled)

  useEffect(() => {
    calendarStore.fetchEvents(uiStore.calendarDate.get())
  }, [enabled])

  return (
    <div class="mb-4">
      <div class="bg-slate-200 px-3 py-1 rounded font-semibold">Calendars</div>
      {Object.keys(calendars).map((email) => (
        <div class="px-3">
          <div class="text-sm font-semibold py-1">{email}</div>
          {calendars[email].map((cal) => {
            const checked = calendarStore.isCalendarEnabled(enabled, cal)
            return (
              <div
                class="text-sm flex items-center py-1 "
                onClick={() => calendarStore.setCalendarEnabled(cal.id, !checked)}
              >
                <div
                  class="mr-2 rounded h-4 w-4 flex justify-center items-center"
                  style={{ background: cal.backgroundColor }}
                >
                  {checked && <CheckIcon class="h-3 w-3" style={{ color: cal.foregroundColor }} />}
                </div>
                <div class="truncate">{cal.summary}</div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
