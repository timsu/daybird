/**
 * https://github.com/SmallImprovements/
 */
import Quill, { DeltaOperation } from 'quill'
import Delta from 'quill-delta'

import { extractDocId, isDocLink } from './docLinkBlot'

type Options = { paste?: boolean; type?: boolean }

const DEFAULT_OPTIONS: Options = {
  paste: true,
  type: true,
}

const REGEXP_GLOBAL = /https?:\/\/[^\s]+/g
const REGEXP_WITH_PRECEDING_WS = /(?:\s|^)(https?:\/\/[^\s]+)/

const sliceFromLastWhitespace = (str: string) => {
  const whitespaceI = str.lastIndexOf(' ')
  const sliceI = whitespaceI === -1 ? 0 : whitespaceI + 1
  return str.slice(sliceI)
}
function registerTypeListener(quill: Quill) {
  quill.keyboard.addBinding(
    { key: ' ' },
    {
      collapsed: true,
      prefix: REGEXP_WITH_PRECEDING_WS,
    },
    (range, context) => {
      const url = sliceFromLastWhitespace(context.prefix)
      const retain = range.index - url.length
      const ops: DeltaOperation[] = retain ? [{ retain }] : []
      ops.push({ delete: url.length }, { insert: url, attributes: { link: url } })
      quill.updateContents({ ops })
      return true
    }
  )
}

function registerPasteListener(quill: Quill) {
  quill.clipboard.addMatcher('A.doclink', (node: HTMLElement, delta) => {
    if (node.children.length != 1) return new Delta()
    return delta
  })
  quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
    if (typeof node.data !== 'string') {
      return
    }
    const matches = (node.data as string).match(REGEXP_GLOBAL)
    if (matches && matches.length > 0) {
      const ops = []
      let str = node.data
      matches.forEach((match) => {
        const split = str.split(match)
        const beforeLink = split.shift()
        ops.push({ insert: beforeLink })

        if (isDocLink(match)) {
          ops.push({ insert: { doclink: extractDocId(match) } })
        } else {
          ops.push({ insert: match, attributes: { link: match } })
        }
        str = split.join(match)
      })
      ops.push({ insert: str })
      delta.ops = ops
    }

    return delta
  })
}

export default class AutoLinks {
  constructor(quill: Quill, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    if (opts.type) {
      registerTypeListener(quill)
    }
    if (opts.paste) {
      registerPasteListener(quill)
    }
  }
}
