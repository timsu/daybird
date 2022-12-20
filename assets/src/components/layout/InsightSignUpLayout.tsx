import { RenderableProps } from 'preact'
import { useEffect } from 'preact/hooks'

import { paths } from '@/config'
import insightloop_logo from '@/images/insightloop_logo_sm.png'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'

export default function (props: RenderableProps<{}>) {
  useEffect(() => {
    uiStore.insightLoop = true
  }, [])

  return (
    <div class="h-full flex flex-col bg-white">
      <img src={insightloop_logo} width={120} height={95} class="mx-auto my-4" />
      <div class="flex flex-col flex-1 rounded-t-3xl bg-inblue-500">
        <div class="flex mx-6 my-4 uppercase">
          <a
            href={paths.INSIGHT_SIGNIN}
            class={classNames(
              'flex-1 text-center text-lg font-medium',
              location.pathname == paths.INSIGHT_SIGNIN ? 'text-white' : 'text-white/50'
            )}
          >
            LOGIN
          </a>
          <a
            href={paths.INSIGHT_SIGNUP}
            class={classNames(
              'flex-1 text-center text-lg font-medium',
              location.pathname == paths.INSIGHT_SIGNUP ? 'text-white' : 'text-white/50'
            )}
          >
            SIGN UP
          </a>
        </div>
        <div class="flex-1 rounded-t-3xl bg-white">{props.children}</div>
      </div>
    </div>
  )
}
