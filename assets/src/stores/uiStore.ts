import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

import { config, paths } from '@/config'
import { User } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { logger } from '@/utils'

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
    this.checkForSleep()
  }

  checkForSleep = () => {
    let lastCheck = Date.now()
    setInterval(() => {
      if (Date.now() - lastCheck > 2 * SLEEP_CHECK_INTERVAL) this.resumeFromSleep()
      lastCheck = Date.now()
    }, SLEEP_CHECK_INTERVAL)
  }

  resumeFromSleep = () => {
    logger.info('resume from sleep detected', navigator.onLine ? 'online' : 'offline')
    if (!navigator.onLine) return
    const projects = projectStore.projects.get()
    projects.forEach((p) => {
      fileStore.loadFiles(p)
    })
  }
}

export const uiStore = new UIStore()
if (config.dev) (window as any)['uiStore'] = uiStore
