import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

import { config } from '@/config'
import { File, User } from '@/models'
import { topicStore } from '@/stores/topicStore'

const LS_RECENT_FILES = 'rf'

class UIStore {
  // --- stores

  path = atom<string>()

  sidebarOpen = atom<boolean>(false)

  calendarOpen = atom<boolean>(window.innerWidth > 700)

  calendarDate = atom<Date>(new Date())

  recentFiles: { id: string; projectId: string }[] = []

  // --- actions

  routerOnChange = action(this.path, 'routerOnChange', (store, ctx: RouterOnChangeArgs<any>) => {
    store.set(ctx.path!)
  })

  initLoggedInUser = (user: User) => {
    topicStore.initTopicflow()

    const recentFiles = localStorage.getItem(LS_RECENT_FILES)
    if (recentFiles) this.recentFiles = JSON.parse(recentFiles)
  }

  addRecentNote = (id: string, projectId: string) => {
    this.recentFiles = this.recentFiles.filter((n) => n.id != id).slice(0, 9)
    this.recentFiles.unshift({ id, projectId })
    localStorage.setItem(LS_RECENT_FILES, JSON.stringify(this.recentFiles))
  }
}

export const uiStore = new UIStore()
if (config.dev) (window as any)['uiStore'] = uiStore
