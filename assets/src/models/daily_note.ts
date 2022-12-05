export class DailyNote {
  public id: string = ''

  public date: string = ''

  public snippet?: string | null

  public projectId?: string

  public static fromJSON(obj: Object, projectId: string): DailyNote {
    let item: DailyNote = Object.assign(new DailyNote(), obj)
    item.projectId = projectId

    return item
  }
}
