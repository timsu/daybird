export enum OAuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export interface GCalendar {
  id: string
  summary: string
  description: string
  location: string
  timeZone: string
  backgroundColor: string
  foregroundColor: string
  colorId: string
  primary: boolean
  accessRole: 'owner' | 'reader'
}

export interface GEvent {
  creator: { email: string; self: boolean }
  etag: string
  eventType: 'default' | 'outOfOffice' | 'focusTime'
  htmlLink: string
  iCalUID: string
  id: string
  kind: 'calendar#event'
  organizer: { email: string; self: boolean }
  start: { date?: string; dateTime?: string; timeZone: string }
  end: { date?: string; dateTime?: string; timeZone: string }
  status: 'confirmed' | 'tentative' | 'cancelled'
  summary: string
  created: string
  updated: string
}
