import { EmbedBlot } from 'parchment'
import { render } from 'preact'

import { paths } from '@/config'

class DocLinkBlot extends EmbedBlot {
  static create(data: string) {
    const node = super.create(data) as HTMLAnchorElement
    node.dataset['link'] = data
    node.href = paths.DOC + '/' + data

    const title = DocLinkBlot.docTitle(data)
    node.onclick = (e) => {
      if (DocLinkBlot.docClick) DocLinkBlot.docClick(data, title)
      e.preventDefault()
    }

    render(<div>{title}</div>, node)

    return node
  }

  static value(domNode: HTMLAnchorElement) {
    return domNode.dataset['link']
  }

  static docTitle: (id: string) => string = (id: string) => {
    return `[[${id}]]`
  }

  static docClick: (id: string, title: string) => void = () => {}

  static blotName = 'doclink'
  static tagName = 'a'
  static className = 'doclink'
}

export function isDocLink(link: string) {
  return link.indexOf(location.origin + paths.DOC) == 0
}

export function extractDocId(link: string) {
  return link.replace(location.origin + paths.DOC + '/', '')
}

export default DocLinkBlot
