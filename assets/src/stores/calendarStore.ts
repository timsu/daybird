import axios, { AxiosError } from 'axios'
import { action, atom, map } from 'nanostores'

import { API, OAuthTokenResponse } from '@/api'
import { GoogleResponse } from '@/components/auth/GoogleServerOAuth'
import { config, GCalendar } from '@/config'
import { GOOGLE_CAL, OAuthToken } from '@/models'
import { assertIsDefined, logger, unwrapError } from '@/utils'

type CalendarsMap = {
  [email: string]: GCalendar[]
}

class CalendarStore {
  // --- stores

  tokens = atom<OAuthToken[] | undefined>(undefined)

  error = atom<string | undefined>()

  loading = atom<boolean>(false)

  calendars = map<CalendarsMap>({})

  // --- actions

  init = async () => {
    const response = await API.getOAuthTokens(GOOGLE_CAL)
    const tokens = response.tokens.map((t) => OAuthToken.fromJSON(t))
    logger.info('[cal] got tokens', tokens)
    this.tokens.set(tokens)
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

    return apiResponse
  }

  fetchCalendars = async () => {
    this.loading.set(true)
    try {
      await Promise.all(this.tokens.get()!.map((t) => this.fetchCalendarForToken(t)))
    } catch (e) {
      logger.warn(e)
      this.error.set(unwrapError(e))
    } finally {
      this.loading.set(false)
    }
  }

  validateToken = async (token: OAuthToken) => {
    assertIsDefined(token.expires_at)
    if (token.expires_at.valueOf() > Date.now()) return token
    logger.info('Google Calendar token expired', token.email, token.expires_at, new Date())

    try {
      let response = await API.refreshOAuthToken(GOOGLE_CAL, token.email!)
      if (response.token) {
        this.updateToken(OAuthToken.fromJSON(response.token))
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

  fetchCalendarForToken = async (token: OAuthToken) => {
    try {
      const validated = await this.validateToken(token)
      if (!validated) return

      const response = await this.googleGet(validated, '/calendar/v3/users/me/calendarList')
      logger.debug('[cal] fetched cals', token.email, response)
      this.calendars.setKey(token.email!, response.items as GCalendar[])
    } catch (e) {
      // error loading calendars
    }
    return this.calendars
  }

  googleGet = async (token: OAuthToken, path: string) => {
    const response = await axios.get('https://www.googleapis.com' + path, {
      headers: { Authorization: `Bearer ${token.access}` },
    })
    return response.data
  }
}

export const calendarStore = new CalendarStore()
if (config.dev) (window as any)['calendarStore'] = calendarStore
