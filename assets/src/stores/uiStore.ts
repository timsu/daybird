import { action, atom } from 'nanostores'
import { route, RouterOnChangeArgs } from 'preact-router'
import toast from 'react-hot-toast'

import { API } from '@/api'
import { config, paths } from '@/config'
import { File, User } from '@/models'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { topicStore } from '@/stores/topicStore'
import tracker from '@/stores/tracker'
import { logger } from '@/utils'
import doOnboarding from '@/utils/onboarding'
import { getOS, isChrome, isEdge, isMobile, isSafari, isSafariWebview } from '@/utils/os'

const SLEEP_CHECK_INTERVAL = 30_000
const LS_RECENT_FILES = 'rf'

export const CALENDAR_OPEN_WIDTH = 800

export const REFRESH_INTERVAL = 86400000

const PREV_PATH_LENGTH = 10

type BeforeInstallPromptEvent = Event & {
  prompt: () => void
}

class UIStore {
  // --- stores

  isPWA = window.matchMedia('(display-mode: standalone)').matches

  insightLoop = location.pathname.includes('/insight/') || location.search.includes('/insight/')

  addie = location.pathname.includes('/addie') || location.search.includes('/addie')

  reactNative = location.search?.includes('?app') || isSafariWebview

  path = atom<string>()
  prevPaths = atom<string[]>([])

  sidebarMenuOpen = atom<boolean>(false)

  sidebarHidden = atom<boolean>(false)

  calendarOpen = atom<boolean>(false)
  manualCalendarOpen: boolean | undefined = undefined

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

  goingBack: boolean = false

  routerOnChange = action(this.path, 'routerOnChange', (store, ctx: RouterOnChangeArgs<any>) => {
    if (ctx.previous && !this.goingBack) {
      let prevPaths = this.prevPaths.get()
      // if we're going to the previous path, don't modify prev paths
      if (prevPaths[0] != ctx.url && ctx.previous != paths.APP) {
        prevPaths = prevPaths.filter((p) => p != ctx.previous).slice(0, PREV_PATH_LENGTH)
        prevPaths.unshift(ctx.previous)
        this.prevPaths.set(prevPaths)
      }
    } else if (this.goingBack) this.goingBack = false
    store.set(ctx.url!)

    if (this.reactNative) {
      window.ReactNativeWebView?.postMessage('url:' + ctx.path)
    }
  })

  goBack = () => {
    const prevPaths = this.prevPaths.get()
    const url = prevPaths.shift()
    if (url) {
      this.goingBack = true
      route(url)
      this.prevPaths.notify()
    }
  }

  initLoggedInUser = (user: User) => {
    tracker.init(user)

    if (authStore.debugMode()) (window as any)['uiStore'] = uiStore
    topicStore.initTopicflow()

    const recentFiles = localStorage.getItem(LS_RECENT_FILES)
    if (recentFiles) this.recentFiles = JSON.parse(recentFiles)

    this.checkForSleep()

    if (!user.timezone) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      authStore.updateUser({ timezone })
    }

    if (uiStore.reactNative) this.initReactNative()
  }

  initReactNative = () => {
    window.addEventListener(
      'message',
      (event) => {
        const message = event.data
        if (!message) return
        if (message.startsWith('nav:')) {
          const rootPath = this.insightLoop ? '/insight/' : '/app/'
          const subPath = message.substring(4)
          route(rootPath + subPath + '?app')
        } else if (config.dev) {
          toast('msg: ' + message)
        }
      },
      false
    )
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
    const currentDoc = docStore.doc.get()?.id
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
    } else if (isEdge) {
      alert(
        "Use the 'Apps' item inside your browser's top-right menu button to install Daybird as a local app"
      )
    } else if (isChrome) {
      alert("Use your browser's top-right menu button to install Daybird as a local app")
    } else {
      alert('Only Chrome and Firefox support adding Daybird to your homescreen')
    }
  }

  checkForOnboarding = (force?: boolean) => {
    const user = authStore.loggedInUser.get()
    if (User.meta(user).ob && !force) return
    logger.info('Onboarding start')
    doOnboarding()
    if (!force) authStore.updateUser({ meta: { ob: 1 } })
  }
}

export const uiStore = new UIStore()
if (config.dev) (window as any)['uiStore'] = uiStore
