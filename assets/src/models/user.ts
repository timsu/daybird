export class User {
  public id: string = ''

  public name: string = ''

  public nickname?: string

  public password?: string

  public email?: string

  public domain?: string

  public profile_img?: string

  public timezone?: string

  public meta: UserMeta = {}

  public static fromJSON(obj: Object): User {
    let item: User = Object.assign(new User(), obj)
    if (!item.meta) item.meta = {}
    return item
  }

  public static meta(user: User | null | undefined): UserMeta {
    return user?.meta || {}
  }
}

export class UserMeta {
  /** last project */
  lp?: string

  /** last file */
  lf?: string

  /** no-calendars */
  nc?: number

  /** onboarded */
  ob?: number
}
