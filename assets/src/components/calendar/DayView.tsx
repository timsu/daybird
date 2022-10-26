import { format, getHours } from 'date-fns'
import { flatten } from 'lodash'
import { useEffect, useState } from 'preact/hooks'

import GoogleServerOAuth, {
    CALENDAR_SCOPES, GoogleResponse, PROFILE_SCOPES, scopesInclude
} from '@/components/auth/GoogleServerOAuth'
import ErrorMessage from '@/components/core/ErrorMessage'
import Loader from '@/components/core/Loader'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import { config, GEvent } from '@/config'
import { authStore } from '@/stores/authStore'
import { calendarStore } from '@/stores/calendarStore'
import { uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'
import {
    CheckIcon, ChevronDownIcon, ChevronUpIcon, RefreshIcon, TrashIcon
} from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = { date: Date }

export default function DayView({ date }: Props) {
  const tokens = useStore(calendarStore.tokens)
  const user = authStore.loggedInUser.get()

  useEffect(() => {
    calendarStore.init()
  }, [])

  if (
    !config.dev &&
    !user?.email?.includes('@listnote.co') &&
    !user?.email?.includes('@daybird.app')
  )
    return null

  return (
    <div class="flex-1 flex flex-col overflow-hidden">
      {tokens != undefined && tokens.length == 0 && <ConnectCalendar />}

      {tokens && tokens.length > 0 && <CalendarView date={date} />}
    </div>
  )
}

function ConnectCalendar() {
  const error = useStore(calendarStore.error)

  const onConnect = async (response: GoogleResponse) => {
    await calendarStore.saveGoogleOAuthToken(response)
  }

  return (
    <div class="p-2 flex flex-col items-center text-center text-sm">
      <div class="py-6 italic text-gray-400">No calendar connected.</div>

      <GoogleServerOAuth
        desc="Add Calendar"
        scope={[...PROFILE_SCOPES, ...CALENDAR_SCOPES]}
        onSuccess={onConnect}
        skipToken
      />

      <ErrorMessage error={error} />
    </div>
  )
}

function CalendarView({ date }: Props) {
  const tokens = useStore(calendarStore.tokens)
  const loading = useStore(calendarStore.loading)
  const error = useStore(calendarStore.error)

  useEffect(() => {
    if (calendarStore.initialFetch) {
      calendarStore.initialFetch = false
      calendarStore.fetchCalendars()
    }
  }, [])

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
    <div class="flex-1 flex flex-col overflow-scroll">
      <ErrorMessage error={error} />

      <Events date={date} />

      <Calendars />
    </div>
  )
}

type Event = {
  source: GEvent
  start: Date
  end: Date
}

function Events({ date }: Props) {
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
    <>
      <div class="flex px-3 items-center">
        <div class="flex-1 font-bold">{format(date, 'MMMM do')}</div>
        <Pressable tooltip="Refresh Events" onClick={() => calendarStore.fetchEvents(date)}>
          <RefreshIcon class="text-gray-500 h-3 w-3" />
        </Pressable>
      </div>
      <div class="flex-1 px-3 py-1 text-sm">
        {allDayEvents.length > 0 && (
          <div class="mb-4">
            <div class="font-semibold">All Day</div>
            {allDayEvents.map((e) => (
              <Event ev={e} />
            ))}
          </div>
        )}

        {regularEvents.map((e) => (
          <div>
            <div class="font-semibold">{timeString(e)}</div>
            <Event ev={e.source} />
          </div>
        ))}
      </div>
    </>
  )
}

function Event({ ev }: { ev: GEvent }) {
  const cal = calendarStore.calendarData[ev.calendar]
  const colors = calendarStore.colors[ev.email]
  const color =
    ev.colorId && colors
      ? colors?.event[ev.colorId]
      : colors?.calendar[cal.colorId] || {
          foreground: cal.foregroundColor,
          background: cal.backgroundColor,
        }
  return (
    <Tooltip message={cal.summary} class="mb-2">
      <div
        style={{ background: color.background, color: color.foreground }}
        class="p-2 rounded-md text-xs flex-1 cursor-pointer"
        onClick={() => window.open(ev.htmlLink)}
      >
        {ev.summary || '(busy)'}
      </div>
    </Tooltip>
  )
}

function Calendars() {
  const [expanded, setExpanded] = useState(false)
  const calendars = useStore(calendarStore.calendars)
  const enabled = useStore(calendarStore.calendarsEnabled)
  const accountError = useStore(calendarStore.accountError)

  const onConnect = async (response: GoogleResponse) => {
    calendarStore.saveGoogleOAuthToken(response)
  }

  useEffect(() => {
    if (Object.keys(accountError).length > 0) setExpanded(true)
  }, [accountError])

  return (
    <div class="flex flex-col">
      <div
        class="bg-slate-200 px-3 py-1 text-sm flex items-center cursor-pointer hover:bg-slate-400"
        onClick={() => setExpanded(!expanded)}
      >
        <div class="mr-2">Calendars</div>
        {expanded ? <ChevronDownIcon class="h-3 w-3" /> : <ChevronUpIcon class="h-3 w-3" />}
      </div>
      {expanded &&
        Object.keys(calendars).map((email) => (
          <div class="px-3">
            <div class="flex py-1 group">
              <div class="text-sm font-semibold flex-1">{email}</div>
              <Pressable onClick={() => calendarStore.disconnectAccount(email)}>
                <TrashIcon class="h-3 w-3 hidden group-hover:block" />
              </Pressable>
            </div>
            {accountError[email] && (
              <div className="my-2 text-center text-red-600">{accountError[email]}</div>
            )}
            {calendars[email].map((cal) => {
              const checked = calendarStore.isCalendarEnabled(enabled, cal)
              const colors = calendarStore.colors[email]
              const color = colors?.calendar[cal.colorId] || {
                foreground: cal.foregroundColor,
                background: cal.backgroundColor,
              }
              return (
                <div
                  class="text-sm flex items-center py-1 cursor-pointer"
                  onClick={() => calendarStore.setCalendarEnabled(cal.id, !checked)}
                >
                  <div
                    class="mr-2 rounded h-4 w-4 flex justify-center items-center"
                    style={{ background: color.background }}
                  >
                    {checked && <CheckIcon class="h-3 w-3" style={{ color: color.foreground }} />}
                  </div>
                  <div class="truncate">{cal.summary}</div>
                </div>
              )
            })}
          </div>
        ))}
      {expanded && (
        <GoogleServerOAuth
          desc="Connect Another"
          scope={[...PROFILE_SCOPES, ...CALENDAR_SCOPES]}
          onSuccess={onConnect}
          skipToken
          buttonClass="my-3 mx-2 flex-1"
        />
      )}
    </div>
  )
}
