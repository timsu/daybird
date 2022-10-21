import { atom } from 'nanostores'

import { API, OAuthTokenResponse } from '@/api'
import { GoogleResponse } from '@/components/auth/GoogleServerOAuth'
import { config } from '@/config'
import { GOOGLE_CAL, OAuthToken } from '@/models'
import { assertIsDefined, logger } from '@/utils'

class CalendarStore {
  // --- stores

  tokens = atom<OAuthToken[] | undefined>(undefined)

  loading = atom<boolean>(false)

  // --- actions

  init = async () => {
    const response = await API.getOAuthTokens(GOOGLE_CAL)
    this.tokens.set(response.tokens)

    if (response.tokens.length > 0) this.fetchEvents()
  }

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

    const newTokens = this.tokens
      .get()
      ?.filter((f) => f.email != apiResponse!.token.email)
      .concat([apiResponse.token])
    this.tokens.set(newTokens)

    this.fetchEvents()

    return apiResponse
  }

  fetchEvents = () => {
    this.loading.set(true)
  }
}

export const calendarStore = new CalendarStore()
if (config.dev) (window as any)['calendarStore'] = calendarStore
