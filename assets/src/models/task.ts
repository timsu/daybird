export enum TaskType {
  TASK = 0,
  STORY,
}

export class Task {
  public id: string = ''

  public title: string = ''

  public shortcode: string = ''

  public type: TaskType = TaskType.TASK

  public completed_at: string | null = null

  public static fromJSON(obj: Object): Task {
    let item: Task = Object.assign(new Task(), obj)

    return item
  }
}
