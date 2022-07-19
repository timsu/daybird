import Quill from 'quill'

import AutoLinks from '@/components/editor/autoLinks'
import DocLinkBlot from '@/components/editor/docLinkBlot'
import ImageDropAndPaste from '@/components/editor/imageDropPaste'
import QuillKeybindings from '@/components/editor/keybindings'
import MarkdownShortcuts from '@/components/editor/markdownShortcuts'

Quill.register('modules/markdownShortcuts', MarkdownShortcuts)
Quill.register('modules/autoLinks', AutoLinks)
Quill.register('modules/imageDropAndPaste', ImageDropAndPaste)

// blots
Quill.register(DocLinkBlot)

export default {
  markdownShortcuts: {},
  autoLinks: true,
  keyboard: {
    bindings: QuillKeybindings,
  },
  toolbar: [
    [{ header: 1 }, { header: 2 }],
    ['bold', 'italic', 'underline', 'strike'],
    ['link', 'blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    ['image'],
    ['clean'],
  ],
  imageDropAndPaste: {
    handler: null,
  },
}
