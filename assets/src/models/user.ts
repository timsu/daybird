export class User {
  public id?: string

  public name?: string

  public nickname?: string

  public password?: string

  public email?: string

  public domain?: string

  public profile_img?: string

  public timezone?: string

  // whether user is an anonymous (pre-auth) user
  public anonymous?: boolean

  public static fromJSON(obj: Object): User {
    let item: User = Object.assign(new User(), obj)
    return item
  }
}
