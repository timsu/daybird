import Link from '@tiptap/extension-link'

export default Link.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-l': () => {
        const previousUrl: string = this.editor.getAttributes('link').href
        let url = window.prompt('URL', previousUrl)

        // cancelled
        if (url === null) {
          return false
        }

        // empty
        if (url === '') {
          return this.editor.chain().focus().extendMarkRange('link').unsetLink().run()
        }

        // update link
        if (!url.includes('://')) url = 'https://' + url
        return this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      },
    }
  },
})
