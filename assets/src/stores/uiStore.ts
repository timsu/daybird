import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

import { API } from '@/api'
import { config } from '@/config'
import { File, User } from '@/models'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { topicStore } from '@/stores/topicStore'
import { logger } from '@/utils'
import { getOS, isChrome, isMobile, isSafari } from '@/utils/os'

const SLEEP_CHECK_INTERVAL = 30_000
const LS_RECENT_FILES = 'rf'

export const CALENDAR_OPEN_WIDTH = 800

export const REFRESH_INTERVAL = 86400000

type BeforeInstallPromptEvent = Event & {
  prompt: () => void
}

class UIStore {
  // --- stores

  isPWA = window.matchMedia('(display-mode: standalone)').matches

  path = atom<string>()

  sidebarMenuOpen = atom<boolean>(false)

  sidebarHidden = atom<boolean>(false)

  calendarOpen = atom<boolean>(false)

  calendarDate = atom<Date>(new Date())

  recentFiles: { id: string; projectId: string; title: string }[] = []

  installPrompt: null | BeforeInstallPromptEvent = null

  loadedAt: number = Date.now()

  startTimer?: (e: MouseEvent) => void
  insertTasks?: (e: MouseEvent) => void

  constructor() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      logger.debug('beforeinstallprompt', e)
      e.preventDefault()
      this.installPrompt = e as BeforeInstallPromptEvent
    })
  }

  // --- actions

  routerOnChange = action(this.path, 'routerOnChange', (store, ctx: RouterOnChangeArgs<any>) => {
    store.set(ctx.path!)
  })

  initLoggedInUser = (user: User) => {
    if (authStore.debugMode()) (window as any)['uiStore'] = uiStore
    topicStore.initTopicflow()

    const recentFiles = localStorage.getItem(LS_RECENT_FILES)
    if (recentFiles) this.recentFiles = JSON.parse(recentFiles)

    this.checkForSleep()

    if (!User.meta(user).ob) modalStore.onboardingModal.set(true)

    if (!user.timezone) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      authStore.updateUser({ timezone })
    }
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

  resumeFromSleep = async () => {
    // check for daily refresh
    if (Date.now() > this.loadedAt + REFRESH_INTERVAL && !docStore.dirty.get()) {
      const response = await API.githash()
      logger.debug('Refresh check', response.hash, config.hash)
      if (!response.hash.startsWith(config.hash)) {
        location.reload()
        return
      }
    }

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

  installAction = () => {
    if (this.installPrompt) this.installPrompt.prompt()
    else if (getOS() == 'ios') {
      if (isSafari) alert('Press the share button at the bottom and select "Add to Home Screen')
      else alert('Please open this site in Safari to add it to your home screen')
    } else if (isChrome) {
      alert("Use your browser's menu to install Daybird as a local app")
    } else {
      alert('Only Chrome and Firefox support adding Daybird to your homescreen')
    }
  }
}

export const uiStore = new UIStore()
