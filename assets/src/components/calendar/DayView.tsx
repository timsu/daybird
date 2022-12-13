import '@event-calendar/core/index.css'
import './calendar.css'

import { format, getHours } from 'date-fns'
import Linkify from 'linkify-react'
import { flatten } from 'lodash'
import { useEffect, useRef, useState } from 'preact/hooks'

import GoogleServerOAuth, {
    CALENDAR_SCOPES, GoogleResponse, PROFILE_SCOPES, scopesInclude
} from '@/components/auth/GoogleServerOAuth'
import Button from '@/components/core/Button'
import ErrorMessage from '@/components/core/ErrorMessage'
import Loader from '@/components/core/Loader'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import { config, GEvent } from '@/config'
import { User } from '@/models'
import { authStore } from '@/stores/authStore'
import { calendarStore } from '@/stores/calendarStore'
import { assertIsDefined, logger } from '@/utils'
import Calendar, { EventClickInfo } from '@event-calendar/core'
import TimeGrid from '@event-calendar/time-grid'
import {
    CheckIcon, ChevronDownIcon, ChevronUpIcon, RefreshIcon, TrashIcon
} from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'
import { createPopper } from '@popperjs/core'

import type { CalEvent } from '@event-calendar/core'
type Props = { date: Date }

export default function DayView({ date }: Props) {
  const tokens = useStore(calendarStore.tokens)

  useEffect(() => {
    calendarStore.init()
  }, [])

  return (
    <div class="flex-1 flex flex-col overflow-hidden">
      {tokens != undefined && tokens.length == 0 && <ConnectCalendar />}

      {tokens && tokens.length > 0 && <CalendarView date={date} />}
    </div>
  )
}

function ConnectCalendar() {
  const error = useStore(calendarStore.error)
  const user = useStore(authStore.loggedInUser)

  if (User.meta(user).nc) return null

  const onConnect = async (response: GoogleResponse) => {
    await calendarStore.saveGoogleOAuthToken(response)
  }

  const hide = () => {
    authStore.updateUser({ meta: { nc: 1 } })
  }

  return (
    <div class="p-2 flex flex-col items-center text-center text-sm">
      <div class="py-6 text-gray-400">Would you like to see your calendar events here?</div>

      <GoogleServerOAuth
        desc="Add Calendar"
        scope={[...PROFILE_SCOPES, ...CALENDAR_SCOPES]}
        onSuccess={onConnect}
        skipToken
      />

      <ErrorMessage error={error} />

      <Pressable className="text-gray-400 mt-8 text-sm" onClick={hide}>
        hide
      </Pressable>
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
    <div class="flex-1 flex flex-col overflow-hidden">
      <ErrorMessage error={error} />

      <Events date={date} />

      <Calendars />
    </div>
  )
}

function Events({ date }: Props) {
  const events = useStore(calendarStore.events)
  const calInstance = useRef<Calendar | undefined>()
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<GEvent>()
  const eventMap = useRef<{ [id: string]: GEvent }>({})
  const [_now, setNow] = useState(0)

  // re-render events every 10 minutes to keep the red line ticking

  useEffect(() => {
    const eventList = flatten(Object.values(events))

    const getColor = (ev: GEvent) => {
      const cal = calendarStore.calendarData[ev.calendar]
      const colors = calendarStore.colors[ev.email]
      return ev.colorId && colors
        ? colors?.event[ev.colorId]
        : colors?.calendar[cal.colorId] || {
            foreground: cal.foregroundColor,
            background: cal.backgroundColor,
          }
    }

    eventList.forEach((ev) => (eventMap.current[ev.id] = ev))
    const calEvents: CalEvent[] = eventList
      .filter((e) => e.start.dateTime)
      .map((e) => ({
        id: e.id,
        allDay: Boolean(e.start.date),
        source: e,
        start: new Date(e.start.dateTime || e.start.date || 0),
        end: new Date(e.end.dateTime || e.start.date || 0),
        title: e.summary || '(busy)',
        backgroundColor: getColor(e).background,
      }))

    const ec = calInstance.current
    if (!ec) {
      const popperClear = (e?: MouseEvent) => {
        const target = e?.target as HTMLElement
        if (target && tooltipRef.current?.contains(target)) return
        if (target?.className.includes('ec-event')) return
        setSelectedEvent(undefined)
        tooltipRef.current!.style.visibility = 'hidden'
        document.removeEventListener('click', popperClear)
      }

      const eventClick = (info: EventClickInfo) => {
        logger.info('[cal] clicked', info)
        assertIsDefined(tooltipRef.current)
        setSelectedEvent((current) => {
          const newEvent = eventMap.current[info.event.id]

          if (newEvent == current) {
            popperClear()
            return undefined
          }

          tooltipRef.current!.style.visibility = 'visible'
          createPopper(info.el, tooltipRef.current!, {
            placement: 'left',
          })

          if (!current) setTimeout(() => document.addEventListener('click', popperClear), 200)

          return newEvent
        })
      }

      calInstance.current = new Calendar({
        target: document.getElementById('ec')!,
        props: {
          plugins: [TimeGrid],
          options: {
            view: 'timeGridDay',
            events: calEvents,
            nowIndicator: true,
            date: date,
            slotHeight: 20,
            eventClick,
          },
        },
      })
    } else {
      ec.setOption('date', date)
      ec.setOption('events', calEvents)
    }

    const nowIndicator = document.getElementsByClassName('ec-now-indicator')[0]
    if (nowIndicator) nowIndicator.scrollIntoView()
    else document.getElementById('ec')?.scrollTo(0, 9999)
  }, [date, events])

  return (
    <>
      <div class="flex px-3 items-center">
        <div class="flex-1 font-bold">{format(date, 'MMMM do')}</div>
        <Pressable tooltip="Refresh Events" onClick={() => calendarStore.fetchEvents(date)}>
          <RefreshIcon class="text-gray-500 h-3 w-3" />
        </Pressable>
      </div>
      <div id="ec" class="flex-1 text-sm"></div>
      <div
        id="cal-tooltip"
        ref={tooltipRef}
        className={
          'bg-white absolute rounded-md p-4 z-10 border shadow-sm sm:w-80 ' +
          (selectedEvent ? 'visible' : 'invisible')
        }
        role="tooltip"
      >
        {selectedEvent && <TooltipContents ev={selectedEvent} />}
      </div>
    </>
  )
}

function TooltipContents({ ev }: { ev: GEvent }) {
  const options = {
    render: ({ attributes, content }: any) => {
      const { href, ...props } = attributes
      return (
        <a href={href} class="text-blue-600 underline" {...props}>
          {content}
        </a>
      )
    },
  }

  return (
    <>
      <div class="max-h-12 text-ellipsis overflow-hidden">
        <div>{ev.summary}</div>
      </div>
      {ev.conferenceData && (
        <a
          href={ev.conferenceData.entryPoints?.[0].uri}
          target="_blank"
          class="my-1 bg-blue-700 p-2 rounded-md inline-flex items-center text-white text-sm font-semibold"
        >
          {ev.conferenceData.conferenceSolution?.iconUri && (
            <img src={ev.conferenceData.conferenceSolution?.iconUri} class="h-4 w-4 mr-2" />
          )}
          {ev.conferenceData.conferenceSolution?.name}
        </a>
      )}
      {ev.location && (
        <div class="text-sm overflow-hidden text-ellipsis">
          <Linkify options={options}>{ev.location}</Linkify>
        </div>
      )}
      {ev.description && (
        <div class="text-xs max-h-[8rem] whitespace-pre-wrap rounded bg-gray-100 p-1 my-1 overflow-scroll text-ellipsis">
          <Linkify options={options}>{ev.description || ''}</Linkify>
        </div>
      )}
      <div class="flex">
        <div class="text-sm flex-1">{ev.calendar}</div>
        {ev.htmlLink && (
          <a href={ev.htmlLink} target="_blank" class="text-sm text-blue-600">
            View / Edit
          </a>
        )}
      </div>
    </>
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

  const toggleExpanded = () => {
    if (!expanded)
      setTimeout(() => {
        document.getElementById('calendarContainer')?.parentElement?.scrollTo(0, 9999)
      }, 0)
    setExpanded(!expanded)
  }

  useEffect(() => {
    if (Object.keys(accountError).length > 0) setExpanded(true)
  }, [accountError])

  return (
    <div class="flex flex-col max-h-96 overflow-auto" id="calendarContainer">
      <div
        class="bg-slate-200 px-3 py-1 text-sm flex items-center cursor-pointer hover:bg-slate-400"
        onClick={() => toggleExpanded()}
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
