import axios, { AxiosError } from 'axios'
import { endOfDay, formatISO, startOfDay } from 'date-fns'
import _ from 'lodash'
import { action, atom, map } from 'nanostores'

import { API, OAuthTokenResponse } from '@/api'
import { GoogleResponse } from '@/components/auth/GoogleServerOAuth'
import { config, GCalendar, GColors, GEvent } from '@/config'
import { GOOGLE_CAL, OAuthToken } from '@/models'
import { authStore } from '@/stores/authStore'
import { uiStore } from '@/stores/uiStore'
import { assertIsDefined, logger, unwrapError } from '@/utils'

type CalendarsMap = {
  [email: string]: GCalendar[]
}

type CalendarData = {
  [id: string]: GCalendar
}

type EventMap = {
  [calendarId: string]: GEvent[]
}

type EnabledMap = { [calendarId: string]: boolean }

type ColorMap = { [email: string]: GColors }

const USER_DATA_CALENDARS = 'calendars'

class CalendarStore {
  // --- stores

  initialFetch = true

  tokens = atom<OAuthToken[] | undefined>(undefined)

  calendarsEnabled = map<EnabledMap>({})

  error = atom<string | undefined>()

  accountError = map<{ [email: string]: string | undefined }>({})

  loading = atom<boolean>(false)

  calendars = map<CalendarsMap>({})

  calendarData: CalendarData = {}

  events = map<EventMap>({})

  colors: ColorMap = {}

  // --- token management

  init = async () => {
    if (authStore.debugMode()) (window as any)['calendarStore'] = calendarStore

    API.getOAuthTokens(GOOGLE_CAL).then((response) => {
      const tokens = response.tokens.map((t) => OAuthToken.fromJSON(t))
      this.tokens.set(tokens)
    })

    API.getUserData(USER_DATA_CALENDARS).then((response) => {
      if (response) this.calendarsEnabled.set(response)
    })
  }

  updateToken = action(this.tokens, 'updateToken', (store, token: OAuthToken) => {
    const newTokens = store
      .get()
      ?.filter((f) => f.email != token.email)
      .concat([token])
    store.set(newTokens)
  })

  saveGoogleOAuthToken = async (response: GoogleResponse): Promise<OAuthTokenResponse> => {
    let apiResponse: OAuthTokenResponse | undefined
    if (response.code) {
      const redirectUri = location.origin + '/oauth/google'
      apiResponse = await API.connectOAuthToken(redirectUri, response.code, GOOGLE_CAL)
    } else {
      apiResponse = await API.updateOAuthToken({
        name: GOOGLE_CAL,
        access: response.access_token,
        refresh: response.refresh_token,
        expires_at: response.expires_in,
      })
    }

    logger.info('[cal] Saved token', apiResponse)
    this.updateToken(OAuthToken.fromJSON(apiResponse.token))
    this.fetchCalendars()

    return apiResponse
  }

  validateToken = async (token: OAuthToken) => {
    assertIsDefined(token.expires_at)
    if (token.expires_at.valueOf() > Date.now()) return token
    logger.info('Google Calendar token expired', token.email, token.expires_at, new Date())

    try {
      let response = await API.refreshOAuthToken(GOOGLE_CAL, token.email!)
      if (response.token) {
        token = OAuthToken.fromJSON(response.token)
        this.updateToken(token)
        return token
      }
    } catch (error) {
      const e = error as AxiosError<{ refreshRejected?: boolean }>
      if (e.response && e.response.data && e.response.data.refreshRejected) {
        this.tokens.set(this.tokens.get()?.filter((t) => t.email != token.email))
        return null
      } else throw e
      // pass-through exceptions in case user is offline
    }
  }

  disconnectAccount = (email: string) => {
    if (!confirm('Disconnect ' + email + "'s calendar?")) return

    API.deleteOAuthToken(GOOGLE_CAL, email)
    this.tokens.set(this.tokens.get()?.filter((t) => t.email != email))
    this.events.set({})
    this.fetchCalendars()
  }

  // --- calendar loading

  fetchCalendars = async () => {
    this.loading.set(true)
    this.error.set(undefined)
    this.accountError.set({})

    try {
      await Promise.all(
        this.tokens.get()!.map((t) =>
          this.fetchCalendarForToken(t).catch((e) => {
            this.accountError.setKey(t.email!, unwrapError(e, true))
          })
        )
      )
    } catch (e) {
      logger.warn(e)
    } finally {
      this.loading.set(false)
    }

    this.fetchEvents(uiStore.calendarDate.get())
  }

  fetchCalendarForToken = async (token: OAuthToken) => {
    const validated = await this.validateToken(token)
    if (!validated) return

    this.fetchColors(validated)
    const response = await this.googleGet(validated, '/calendar/v3/users/me/calendarList')
    logger.debug('[cal] fetched cals', token.email, response)

    const calendars = response.items as GCalendar[]
    this.calendars.setKey(token.email!, calendars)
    calendars.forEach((c) => {
      c.email = token.email!
      this.calendarData[c.id] = c
    })

    return this.calendars
  }

  setCalendarEnabled = (key: string, setting: boolean) => {
    if (this.calendarsEnabled.get()[key] == setting) return
    this.calendarsEnabled.setKey(key, setting)

    const data = this.calendarsEnabled.get()
    API.setUserData(USER_DATA_CALENDARS, data)

    if (setting) {
      const cal = this.calendarData[key]
      const date = uiStore.calendarDate.get()
      const token = this.tokens.get()?.find((t) => t.email == cal.email)
      this.fetchEventsForCalendar(token!, cal.id, date)
    } else this.events.setKey(key, [])
  }

  isCalendarEnabled = (enabled: EnabledMap, cal: GCalendar) => {
    const setting = enabled[cal.id]
    if (setting === undefined) return cal.accessRole != 'reader' && cal.selected
    return setting
  }

  // --- event loading

  fetchEvents = async (date: Date) => {
    if (this.loading.get()) return
    try {
      await Promise.all(
        this.tokens.get()!.map((t) => {
          this.fetchEventsForToken(t, date)
        })
      )
    } catch (e) {
      logger.warn(e)
      this.error.set(unwrapError(e, true))
    }
  }

  fetchEventsForToken = async (token: OAuthToken, date: Date) => {
    const calendars = this.calendars.get()[token.email!]
    if (!calendars) return

    const validated = await this.validateToken(token)
    if (!validated) return

    const enabled = this.calendarsEnabled.get()
    await Promise.all(
      calendars.map(async (cal) => {
        if (!this.isCalendarEnabled(enabled, cal)) return
        this.fetchEventsForCalendar(validated, cal.id, date).catch((e) => {
          this.accountError.setKey(token.email!, unwrapError(e, true))
        })
      })
    )
  }

  fetchEventsForCalendar = async (token: OAuthToken, calendarId: string, date: Date) => {
    const query = `timeMin=${formatISO(startOfDay(date))}&timeMax=${formatISO(
      endOfDay(date)
    )}&singleEvents=true`
    const response = await this.googleGet(
      token,
      `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query}`
    )
    const events = response.items as GEvent[]
    events.forEach((e) => {
      e.email = token.email!
      e.calendar = calendarId
    })
    this.events.setKey(calendarId, events)
  }

  fetchColors = async (token: OAuthToken) => {
    const response = await this.googleGet(token, `/calendar/v3/colors`)
    this.colors[token.email!] = response as GColors
  }

  // --- helpers

  googleGet = async (token: OAuthToken, path: string) => {
    const response = await axios.get('https://www.googleapis.com' + path, {
      headers: { Authorization: `Bearer ${token.access}` },
    })
    return response.data
  }
}

export const calendarStore = new CalendarStore()
