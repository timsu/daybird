import { isSameYear } from 'date-fns'

export enum TaskType {
  TASK = 0,
  STORY,
}

export enum TaskState {
  IN_PROGRESS = 'in_progress',
}

export class Task {
  public id: string = ''

  public title: string = ''

  public short_code: string = ''

  public type?: TaskType | undefined

  public doc?: string

  public priority?: number

  public state?: TaskState | null

  public due_at?: string | null

  public completed_at?: string | null

  public archived_at?: string | null

  public deleted_at?: string | null

  public static fromJSON(obj: Object): Task {
    let item: Task = Object.assign(new Task(), obj)

    return item
  }

  public static renderDueDate(task: Task) {
    if (!task.due_at) return
    const due = new Date(task.due_at)
    return due.toLocaleDateString(navigator.language, {
      month: 'numeric',
      day: 'numeric',
      year: isSameYear(new Date(), due) ? undefined : '2-digit',
    })
  }
}
