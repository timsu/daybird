import { Inputs, useEffect } from 'preact/hooks'

import { isMac } from '@/utils/os'

export default function (handler: (e: KeyboardEvent) => boolean, inputs: Inputs) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const result = handler(e)
      if (result) e.preventDefault()
    }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, inputs)
}

export const checkShortcut = (e: KeyboardEvent, ...keys: string[]) => {
  const modifier = isMac ? e.metaKey : e.ctrlKey
  return modifier && keys.indexOf(e.key) > -1
}
