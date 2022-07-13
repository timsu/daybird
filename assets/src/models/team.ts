export class Team {
  public id?: string

  public name?: string

  public static fromJSON(obj: Object): Team {
    let item: Team = Object.assign(new Team(), obj)
    return item
  }
}
