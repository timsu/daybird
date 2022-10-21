export class OAuthToken {
  public name: string = ''

  public access: string = ''

  public email?: string

  public refresh?: string

  public expires_at?: Date | number

  public meta?: any

  public static fromJSON(obj: any) {
    let item: OAuthToken = Object.assign(new OAuthToken(), obj)

    if (obj.expires_at) item.expires_at = new Date(obj.expires_at)
    if (!item.meta) item.meta = {} as any

    return item
  }
}

export const GOOGLE_CAL = 'google-cal'
