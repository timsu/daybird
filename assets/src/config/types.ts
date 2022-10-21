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
