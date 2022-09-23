export enum FileType {
  DOC = 0,
  FOLDER,
}

export class File {
  public id: string = ''

  public name: string = ''

  public type: FileType = FileType.DOC

  public parent?: string

  public archived_at?: string | null

  public deleted_at?: string | null

  public static fromJSON(obj: Object): File {
    let item: File = Object.assign(new File(), obj)

    return item
  }
}

// tree version of file
export type TreeFile = {
  file: File

  children?: TreeFile[]
}
