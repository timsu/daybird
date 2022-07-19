export class Project {
  public id: string = ''

  public name: string = ''

  public shortcode: string = ''

  public static fromJSON(obj: Object): Project {
    let item: Project = Object.assign(new Project(), obj)
    return item
  }
}
