import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

import { config } from '@/config'
import { File, User } from '@/models'
import { topicStore } from '@/stores/topicStore'

const SLEEP_CHECK_INTERVAL = 30_000

class UIStore {
  // --- stores

  path = atom<string>()

  sidebarOpen = atom<boolean>(false)

  recentFiles: { id: string; projectId: string }[] = []

  // --- actions

  routerOnChange = action(this.path, 'routerOnChange', (store, ctx: RouterOnChangeArgs<any>) => {
    store.set(ctx.path!)
  })

  initLoggedInUser = (user: User) => {
    topicStore.initTopicflow()
  }

  addRecentNote = (id: string, projectId: string) => {
    this.recentFiles = this.recentFiles.filter((n) => n.id != id).slice(0, 9)
    this.recentFiles.unshift({ id, projectId })
  }
}

export const uiStore = new UIStore()
if (config.dev) (window as any)['uiStore'] = uiStore
