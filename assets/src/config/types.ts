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
  selected: boolean
  accessRole: 'owner' | 'reader'
  email: string
}

export interface GEvent {
  calendar: string
  creator: { email: string; self: boolean }
  etag: string
  eventType: 'default' | 'outOfOffice' | 'focusTime'
  htmlLink: string
  iCalUID: string
  id: string
  kind: 'calendar#event'
  location?: string
  organizer: { email: string; self: boolean }
  start: { date?: string; dateTime?: string; timeZone: string }
  end: { date?: string; dateTime?: string; timeZone: string }
  status: 'confirmed' | 'tentative' | 'cancelled'
  summary: string
  created: string
  updated: string
  colorId?: string
  description?: string
  conferenceData?: {
    conferenceSolution: {
      iconUri: string
      key: { type: string }
      name: string
    }
    entryPoints: {
      entryPointType: string
      label: string
      uri: string
    }[]
  }
  email: string
}

export interface GColors {
  calendar: {
    [key: string]: {
      background: string
      foreground: string
    }
  }
  event: {
    [key: string]: {
      background: string
      foreground: string
    }
  }
}
