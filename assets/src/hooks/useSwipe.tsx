import { useEffect } from 'preact/hooks'

import { uiStore } from '@/stores/uiStore'
import { isMobile } from '@/utils/os'

export default (onSwipe: (direction: 'left' | 'right') => void, el?: HTMLElement) => {
  if (!isMobile || uiStore.reactNative) return

  useEffect(() => {
    el = el || document.body

    let touchStartX: number = 0,
      touchStartTime: number = 0
    function touchStart(e: TouchEvent) {
      touchStartX = e.changedTouches[0].screenX
      touchStartTime = Date.now()
      e.preventDefault()
    }

    function touchEnd(e: TouchEvent) {
      const touchEndX = e.changedTouches[0].screenX
      const touchEndTime = Date.now()

      // threshold: 80px and 500ms
      if (Math.abs(touchEndX - touchStartX) < 80) return
      if (touchEndTime - touchStartTime > 500) return

      const direction = touchEndX < touchStartX ? 'left' : 'right'
      onSwipe(direction)
    }

    el.addEventListener('touchstart', touchStart)
    el.addEventListener('touchend', touchEnd)

    return () => {
      el!.removeEventListener('touchstart', touchStart)
      el!.removeEventListener('touchend', touchEnd)
    }
  }, [el])
}
