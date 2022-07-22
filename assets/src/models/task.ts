export enum TaskType {
  TASK = 0,
  STORY,
}

export class Task {
  public id: string = ''

  public title: string = ''

  public short_code: string = ''

  public type: TaskType = TaskType.TASK

  public completed_at: string | null = null

  public archived_at: string | null = null

  public deleted_at: string | null = null

  public static fromJSON(obj: Object): Task {
    let item: Task = Object.assign(new Task(), obj)

    return item
  }
}
