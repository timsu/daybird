export enum DebounceStyle {
  RESET_ON_NEW, // reset wait timer if new events come in
  IMMEDIATE_THEN_WAIT, // invoke function immediately, don't run again until timeout expires
  IGNORE_NEW, // wait, ignoring new requests
  QUEUE_LAST, // invoke function immediately, don't run again until timeout expires, but queue last function and run if it was called
}

const debounceTimers: { [id: string]: any } = {}

export function debounce(id: string, func: () => void, wait: number, style: DebounceStyle) {
  let timer = debounceTimers[id]

  switch (style) {
    case DebounceStyle.IMMEDIATE_THEN_WAIT:
      if (timer) return
      debounceTimers[id] = setTimeout(() => delete debounceTimers[id], wait)
      func()
      return

    case DebounceStyle.QUEUE_LAST:
      if (timer) {
        timer.queued = func
        timer.wait = wait
        return
      }
      debounceTimers[id] = {
        timer: setTimeout(() => {
          const queued = debounceTimers[id]
          delete debounceTimers[id]
          if (queued.queued) debounce(id, queued.queued, queued.wait, style)
        }, wait),
      }
      func()
      return

    case DebounceStyle.IGNORE_NEW:
      if (timer) return
      debounceTimers[id] = setTimeout(() => {
        func()
        delete debounceTimers[id]
      }, wait)
      return

    case DebounceStyle.RESET_ON_NEW:
    default:
      clearTimeout(timer)
      debounceTimers[id] = setTimeout(() => {
        func()
        delete debounceTimers[id]
      }, wait)
      return
  }
}

export function clearDebounce(id: string) {
  let timer = debounceTimers[id]
  if (typeof timer == 'object') clearTimeout(timer.timer)
  else clearTimeout(timer)
  delete debounceTimers[id]
}
