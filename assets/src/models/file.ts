export enum FileType {
  DOC = 0,
  FOLDER,
}

export class File {
  public id: string = ''

  public name: string = ''

  public type: FileType = FileType.DOC

  public parent?: string | null

  public projectId?: string

  public archived_at?: string | null

  public deleted_at?: string | null

  public provisional?: boolean

  public static fromJSON(obj: Object, projectId: string): File {
    let item: File = Object.assign(new File(), obj)
    item.projectId = projectId

    return item
  }

  public static newFile(props: File): File {
    return {
      ...props,
      provisional: true,
    }
  }
}

// tree version of file
export type TreeFile = {
  key: string
  label: string
  file: File
  nodes?: TreeFile[]
}

export const sortFiles = (files: File[]) =>
  files.sort((a, b) => (a.type == b.type ? a.name.localeCompare(b.name) : b.type - a.type))

export function makeTreeFile(file: File) {
  const node: TreeFile = { key: file.id, label: file.name, file }
  if (file.type == FileType.FOLDER) node.nodes = []
  return node
}

export function fileListToTree(files: File[]): TreeFile[] {
  const treeMap: { [id: string]: TreeFile } = {}
  const roots: TreeFile[] = []

  files.forEach((file) => {
    const treeFile = makeTreeFile(file)
    treeMap[file.id] = treeFile
  })

  files.forEach((file) => {
    const treeFile = treeMap[file.id]
    const parent = file.parent && treeMap[file.parent]

    if (parent) parent.nodes?.push(treeFile)
    else roots.push(treeFile)
  })

  return roots
}
