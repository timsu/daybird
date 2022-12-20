import { RenderableProps } from 'preact'
import { useEffect } from 'preact/hooks'

import { uiStore } from '@/stores/uiStore'

export default function (props: RenderableProps<{ darkFooter?: boolean }>) {
  useEffect(() => {
    uiStore.insightLoop = true
  }, [])
  return <div class="h-full flex flex-col bg-white">{props.children}</div>
}
