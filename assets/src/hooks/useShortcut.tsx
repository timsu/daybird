import { Inputs, useEffect } from 'preact/hooks'

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
