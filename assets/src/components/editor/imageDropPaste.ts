import Quill from 'quill'

type Options = {
  handler?: (blob: string, type: string) => void
}

// from https://github.com/chenjuneking/quill-image-drop-and-paste
// with modifications
class ImageDropAndPaste {
  quill: Quill
  options: Options

  constructor(quill: Quill, options = {}) {
    this.quill = quill
    this.options = options
    this.quill.root.addEventListener('drop', this.handleDrop, false)
    this.quill.root.addEventListener('paste', this.handlePaste, false)
    this.quill.getModule('toolbar').addHandler('image', this.selectLocalImage.bind(this))
  }

  /**
   * Select local image
   */
  selectLocalImage() {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon')
    input.click()

    // Listen upload local image and save to server
    input.onchange = () => this.readFiles(input.files, this.handleFileRead)
  }

  /* handle image drop event
   */
  handleDrop = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      if (document.caretRangeFromPoint) {
        const selection = document.getSelection()
        const range = document.caretRangeFromPoint(e.clientX, e.clientY)
        if (selection && range) {
          selection.setBaseAndExtent(
            range.startContainer,
            range.startOffset,
            range.startContainer,
            range.startOffset
          )
        }
      }
      this.readFiles(e.dataTransfer.files, this.handleFileRead)
    }
  }

  /* handle image paste event
   */
  handlePaste = (e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items && e.clipboardData.items.length) {
      this.readFiles(e.clipboardData.items, (dataUrl, type) => {
        setTimeout(() => {
          if (typeof this.options.handler === 'function') {
            this.options.handler(dataUrl, type)
          } else {
            this.insert(dataUrl, type)
          }
        }, 0)
      })
    }
  }

  handleFileRead = (dataUrl: string, type: string) => {
    if (typeof this.options.handler === 'function') {
      this.options.handler(dataUrl, type)
    } else {
      this.insert.call(this, dataUrl, type)
    }
  }

  /* read the files
   */
  readFiles(
    files: FileList | DataTransferItemList | null,
    callback: (url: string, type: string) => void
  ) {
    if (!files) return

    const coercedType = files as unknown as (File | DataTransferItem)[]
    Array.from(coercedType).forEach((file: File | DataTransferItem) => {
      var type = file.type
      if (!file.type.match(/^image\/(gif|jpe?g|a?png|svg|webp|bmp)/i)) return
      const reader = new FileReader()
      reader.onload = (e) => {
        callback((e.target as any).result, type)
      }
      const blob = isDataTransferItem(file) ? file.getAsFile() : file
      if (blob instanceof Blob) reader.readAsDataURL(blob)
    })
  }

  /* insert into the editor
   */
  insert(dataUrl: string, type: string) {
    const index = (this.quill.getSelection() || { index: null }).index || this.quill.getLength()
    this.quill.insertEmbed(index, 'image', dataUrl, 'user')
  }
}

const isDataTransferItem = (file: DataTransferItem | File): file is DataTransferItem => {
  return (file as DataTransferItem).getAsFile !== undefined
}

export default ImageDropAndPaste
