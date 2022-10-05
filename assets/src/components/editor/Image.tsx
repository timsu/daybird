import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import { API } from '@/api'
import { projectStore } from '@/stores/projectStore'
import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'

export interface ImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType
    }
  }
}

export const inputRegex = /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/

export const Image = Node.create<ImageOptions>({
  name: 'image',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64 ? 'img[src]' : 'img[src]:not([src^="data:"])',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title] = match

          return { src, alt, title }
        },
      }),
    ]
  },

  addProseMirrorPlugins() {
    async function uploadImageCreateNode(image: File, view: EditorView) {
      const { schema } = view.state
      const response = await API.uploadAttachment(image, projectStore.currentProject.get()!.id)
      const node = schema.nodes.image.create({
        src: response.url,
        title: image.name,
      })
      return node
    }

    return [
      new Plugin({
        key: new PluginKey('imageHandler'),

        props: {
          handlePaste(view: EditorView, event: ClipboardEvent, slice) {
            const items = event.clipboardData?.items || []
            for (const item of items) {
              if (item.type.indexOf('image') === 0) {
                event.preventDefault()
                const image = item.getAsFile()

                uploadImageCreateNode(image!, view).then((node) => {
                  const transaction = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(transaction)
                })
              }
            }
            return false
          },

          handleDOMEvents: {
            drop(view: EditorView, ev: Event) {
              const event = ev as DragEvent
              const hasFiles =
                event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length

              if (!hasFiles) {
                return
              }

              const images = Array.from(event.dataTransfer.files).filter((file) =>
                /image/i.test(file.type)
              )

              if (images.length === 0) {
                return
              }

              event.preventDefault()

              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
              images.forEach(async (image) => {
                const node = await uploadImageCreateNode(image, view)
                const transaction = view.state.tr.insert(coordinates!.pos, node)
                view.dispatch(transaction)
              })
            },
          },
        },
      }),
    ]
  },
})
