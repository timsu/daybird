import { RenderableProps } from 'preact'
import { useEffect } from 'preact/hooks'
import { Toaster } from 'react-hot-toast'

import { paths } from '@/config'
import insightloop_logo from '@/images/insightloop_logo_sm.png'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'

export default function (props: RenderableProps<{}>) {
  useEffect(() => {
    uiStore.insightLoop = true
  }, [])

  return (
    <div class="h-full flex flex-col bg-white select-none">
      <Toaster />
      <img src={insightloop_logo} width={120} height={95} class="mx-auto my-4 sm:mt-20" />
      <div class="flex flex-col flex-1 rounded-t-3xl bg-inblue-500 sm:w-[600px] sm:mt-20 sm:mx-auto sm:rounded-3xl sm:p-10 sm:pt-2 sm:flex-grow-0">
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
