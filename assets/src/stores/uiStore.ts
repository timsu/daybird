import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

import { config } from '@/config'
import { File, User } from '@/models'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { topicStore } from '@/stores/topicStore'
import { logger } from '@/utils'

const SLEEP_CHECK_INTERVAL = 30_000
const LS_RECENT_FILES = 'rf'

class UIStore {
  // --- stores

  isPWA = false

  path = atom<string>()

  sidebarOpen = atom<boolean>(false)

  calendarOpen = atom<boolean>(false)

  calendarDate = atom<Date>(new Date())

  recentFiles: { id: string; projectId: string; title: string }[] = []

  // --- actions

  routerOnChange = action(this.path, 'routerOnChange', (store, ctx: RouterOnChangeArgs<any>) => {
    store.set(ctx.path!)
  })

  initLoggedInUser = (user: User) => {
    topicStore.initTopicflow()

    const recentFiles = localStorage.getItem(LS_RECENT_FILES)
    if (recentFiles) this.recentFiles = JSON.parse(recentFiles)

    this.checkForSleep()
  }

  checkForSleep = () => {
    let lastCheck = Date.now()
    let needsRefresh = false

    setInterval(() => {
      if (Date.now() - lastCheck > 5 * SLEEP_CHECK_INTERVAL) {
        logger.info(
          'resume from sleep detected',
          Date.now() - lastCheck,
          document.visibilityState,
          navigator.onLine ? 'online' : 'offline'
        )
        if (document.visibilityState == 'visible' && navigator.onLine) this.resumeFromSleep()
        else needsRefresh = true
      }
      lastCheck = Date.now()
    }, SLEEP_CHECK_INTERVAL)

    document.addEventListener('visibilitychange', () => {
      if (needsRefresh && navigator.onLine) {
        this.resumeFromSleep()
        needsRefresh = false
      }
    })
  }

  resumeFromSleep = () => {
    const projects = projectStore.projects.get()
    projects.forEach((p) => {
      fileStore.loadFiles(p)
    })
    const currentDoc = docStore.id.get()
    if (currentDoc) {
      docStore.loadDoc(projectStore.currentProject.get()!, currentDoc)
    }
  }

  addRecentNote = (id: string, projectId: string, title: string) => {
    this.recentFiles = this.recentFiles.filter((n) => n.id != id).slice(0, 9)
    this.recentFiles.unshift({ id, projectId, title })
    localStorage.setItem(LS_RECENT_FILES, JSON.stringify(this.recentFiles))
  }
}

export const uiStore = new UIStore()
if (config.dev) (window as any)['uiStore'] = uiStore
