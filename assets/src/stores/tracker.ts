import { config } from '@/config'
import { User } from '@/models'
import { authStore } from '@/stores/authStore'
import * as amplitude from '@amplitude/analytics-browser'

class Tracker {
  init(user: User | undefined) {
    if (!config.dev) amplitude.init('c68d038d897098b08adf9d5bd2d4f540')
    amplitude.setUserId(user?.id)
  }

  openJournal() {
    amplitude.logEvent('openJournal')
  }

  journalEntry() {
    amplitude.logEvent('journalEntry')
  }

  insightEntry(type: string) {
    amplitude.logEvent('insightEntry', { type })
  }

  openAddie() {
    amplitude.logEvent('openAddie')
  }

  addieEvent(type: string) {
    amplitude.logEvent('addieEvent', { type })
  }

  addieGPTChat(input: string) {
    amplitude.logEvent('addieGPTChat', { input })
  }

  addieRating(rating: string, messages: number) {
    amplitude.logEvent('addieRating', { rating, messages })
  }
}

const tracker = new Tracker()
export default tracker
