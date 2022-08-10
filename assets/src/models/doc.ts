export type Doc = {
  type: 'doc'
  content: Block[]
}

type Block = {
  type: string
  content: Block[]
}
