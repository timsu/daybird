import { fileStore } from '@/stores/fileStore'
import { Mark, markInputRule, mergeAttributes } from '@tiptap/core'

const inputRegex = /(?:^|\s)((?:\[\[)((?:[^\]]+))(?:\]\]))$/

export const NODE_NAME = 'wikilink'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>
}

export const WikiLink = Mark.create<WikiLinkOptions>({
  name: NODE_NAME,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const elem = document.createElement('a')

    Object.entries(mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)).forEach(
      ([attr, val]) => elem.setAttribute(attr, val)
    )

    elem.addEventListener('click', (e) => {
      e.preventDefault()
      const linkContent = elem.innerText
      fileStore.handleWikiLink(linkContent)
    })

    return elem
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ]
  },
})
