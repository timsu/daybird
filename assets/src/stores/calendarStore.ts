import { atom } from 'nanostores'

import { API } from '@/api'
import { config } from '@/config'
import { GOOGLE_CAL, OAuthToken } from '@/models'

class CalendarStore {
  // --- stores

  tokens = atom<OAuthToken[] | undefined>(undefined)

  // --- actions

  init = async () => {
    const response = await API.getOAuthTokens(GOOGLE_CAL)
    this.tokens.set(response.tokens)
  }
}

export const calendarStore = new CalendarStore()
if (config.dev) (window as any)['calendarStore'] = calendarStore
