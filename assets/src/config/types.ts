export enum OAuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export type FileType = 'doc' | 'folder'

export type File = {
  name: string
  path: string
  type: FileType
  children?: File[]
  depth: number
}
