import Quill from 'quill'

declare global {
  interface Window {
    quill?: Quill
  }
}
