import { action, atom, onMount } from 'nanostores'
import { route } from 'preact-router'
import { v4 as uuid } from 'uuid'

import { API } from '@/api'
import { config, LS_AUTH_TOKENS, OAuthProvider, paths } from '@/config'
import { AuthTokenPair, Project, User } from '@/models'
import { uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'

import { projectStore } from './projectStore'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js')
}

class AuthStore {
  // --- stores

  clientId = uuid()

  loggedInUser = atom<User | null | undefined>()

  authTokens = atom<AuthTokenPair | undefined>()

  oAuthSubmitting = atom<OAuthProvider | undefined>()

  // --- initialization

  init = () => {
    const tokens = localStorage.getItem(LS_AUTH_TOKENS)

    if (tokens) {
      this.loginHelper(JSON.parse(tokens)).catch((e) => {
        logger.warn(e)
        this.loggedInUser.set(null)
      })
    } else this.loggedInUser.set(null)
  }

  loginHelper = async (givenTokens: AuthTokenPair) => {
    const tokens = await API.exchangeAndSetAuthToken(givenTokens)
    this.authTokens.set(tokens)

    const { access, refresh } = tokens || {}
    if (!tokens?.access) throw 'Tokens were invalid'

    const response = await API.listProjects()
    logger.debug('AUTH - logged in', response)

    if (
      tokens &&
      (refresh?.token != givenTokens.refresh?.token || access?.token != givenTokens.access?.token)
    ) {
      this.saveTokens(tokens)
    }

    const user = User.fromJSON(response.user)
    this.loggedInUser.set(user)
    projectStore.updateProjects(response.projects.map(Project.fromJSON))
    projectStore.updateCurrentProject(user)

    if (!projectStore.activeProjects.get().length && location.pathname != paths.PROJECTS) {
      setTimeout(() => route(paths.PROJECTS), 100)
    }
    // on occasion, hot module reload doesn't update properly without timeout
    if (config.dev) setTimeout(() => this.loggedInUser.notify(), 500)
    if (this.debugMode()) (window as any)['authStore'] = authStore
  }

  saveTokens = async (tokens: AuthTokenPair) => {
    logger.debug('AUTH —— saving tokens', tokens)
    await localStorage.setItem(LS_AUTH_TOKENS, JSON.stringify(tokens))
  }

  updateTokens = action(this.authTokens, 'updateTokens', (store, tokens: AuthTokenPair) => {
    store.set(tokens)
    if (tokens.refresh?.token) this.saveTokens(tokens)
  })

  updateAPITokens = (newTokens: AuthTokenPair) => API.setAuthTokens(newTokens)

  // --- sign in / sign up

  createAccount = async (name: string, email: string, password: string) => {
    logger.info('AUTH —— create account', name, email)
    const response = await API.createAccount(name, email, password)
    const tokens = { refresh: { token: response.token! } }
    this.saveTokens(tokens)
    this.postAuth()
  }

  logInElseSignUpOAuth = async (
    provider: OAuthProvider,
    token: string,
    name?: string,
    email?: string
  ) => {
    logger.info(`AUTH —— logInElseSignUpOAuth`, provider, token)

    try {
      this.oAuthSubmitting.set(provider)
      const response = await API.logInElseSignUpOAuth(provider, token, name, email)
      const tokens = { refresh: { token: response.token! } }
      this.saveTokens(tokens)
      this.postAuth()
    } finally {
      this.oAuthSubmitting.set(undefined)
    }
  }

  signIn = async (email: string, password: string) => {
    const response = await API.signIn(email, password)
    const tokens = { refresh: { token: response.token! } }
    this.saveTokens(tokens)
    this.postAuth()
  }

  postAuth = () => {
    const search = new URLSearchParams(location.search)
    const postRedirect =
      search.get('path') ||
      (uiStore.insightLoop ? paths.JOURNAL : uiStore.addie ? paths.ADDIE : paths.TODAY)

    logger.info('post auth redirect', postRedirect, uiStore.insightLoop)

    location.href = postRedirect.match(/^\/[^\/]+/) ? postRedirect : paths.APP
  }

  logout = () => {
    localStorage.removeItem(LS_AUTH_TOKENS)
    const signInPath = uiStore.insightLoop ? paths.INSIGHT_SIGNIN : paths.SIGNIN

    location.href =
      signInPath +
      (uiStore.insightLoop ? '?path=' + paths.JOURNAL : '') +
      (uiStore.reactNative ? '?app' : '')
  }

  debugMode = () => {
    if (config.dev) return true
    const user = this.loggedInUser.get()
    if (!user) return false
    return user.email?.includes('@listnote.co') || user.email?.includes('@daybird.app')
  }

  // --- user management

  updateUser = action(this.loggedInUser, 'updateUser', async (store, updates: Partial<User>) => {
    logger.info(`AUTH —— Update User`, updates)
    const response = await API.updateUser(updates)

    // by default, don't update logged in user since that triggers re-renders
    Object.assign(store.get()!, User.fromJSON(response.user))
  })
}

export const authStore = new AuthStore()
