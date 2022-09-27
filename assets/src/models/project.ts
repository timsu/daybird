export enum ProjectRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export class Project {
  public id: string = ''

  public name: string = ''

  public shortcode: string = ''

  public deleted_at?: string

  public members?: ProjectMember[]

  public static fromJSON(obj: Object): Project {
    let item: Project = Object.assign(new Project(), obj)
    return item
  }
}

export type ProjectMember = {
  id?: string
  name?: string
  email?: string
  role: ProjectRole
}
