import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

import { config } from '@/config'
import { User } from '@/models'
import { topicStore } from '@/stores/topicStore'

const SLEEP_CHECK_INTERVAL = 30_000

class UIStore {
  // --- stores

  path = atom<string>()

  sidebarOpen = atom<boolean>(false)

  // --- actions

  routerOnChange = action(this.path, 'routerOnChange', (store, ctx: RouterOnChangeArgs<any>) => {
    store.set(ctx.path!)
  })

  initLoggedInUser = (user: User) => {
    topicStore.initTopicflow()
  }
}

export const uiStore = new UIStore()
if (config.dev) (window as any)['uiStore'] = uiStore
