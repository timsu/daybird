export class Project {
  public id: string = ''

  public name: string = ''

  public shortcode: string = ''

  public deleted_at?: string

  public static fromJSON(obj: Object): Project {
    let item: Project = Object.assign(new Project(), obj)
    return item
  }
}
