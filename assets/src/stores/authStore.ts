import { action, atom, onMount } from 'nanostores'

import { API } from '@/api'
import { config, LS_AUTH_TOKENS, paths } from '@/config'
import { AuthTokenPair, Project, User } from '@/models'
import { logger } from '@/utils'

import { projectStore } from './projectStore'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js')
}

class AuthStore {
  // --- stores

  loggedInUser = atom<User | null | undefined>()

  authTokens = atom<AuthTokenPair | undefined>()

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
    const { access, refresh } = tokens || {}
    if (!tokens?.access) throw 'Tokens were invalid'

    const response = await API.listProjects()
    logger.info('AUTH - logged in', response)

    if (
      tokens &&
      (refresh?.token != givenTokens.refresh?.token || access?.token != givenTokens.access?.token)
    ) {
      this.saveTokens(tokens)
    }

    const user = User.fromJSON(response.user)
    this.loggedInUser.set(user)
    projectStore.updateProjects(response.projects.map((p) => Project.fromJSON(p)))
    projectStore.updateCurrentProject(user)

    // on occasion, hot module reload doesn't update properly without timeout
    if (config.dev) setTimeout(() => this.loggedInUser.notify(), 500)
  }

  saveTokens = async (tokens: AuthTokenPair) => {
    logger.info('AUTH —— saving tokens', tokens)
    await localStorage.setItem(LS_AUTH_TOKENS, JSON.stringify(tokens))
  }

  updateTokens = action(this.authTokens, 'updateTokens', (store, tokens: AuthTokenPair) => {
    store.set(tokens)
    if (tokens.refresh?.token) this.saveTokens(tokens)
  })

  // --- sign in / sign up

  createAccount = async (name: string, email: string, password: string) => {
    logger.info('AUTH —— create account', name, email)
    const response = await API.createAccount(name, email, password)
    const tokens = { refresh: { token: response.token! } }
    this.saveTokens(tokens)

    location.href = paths.APP
  }

  signIn = async (email: string, password: string) => {
    const response = await API.signIn(email, password)
    const tokens = { refresh: { token: response.token! } }
    this.saveTokens(tokens)

    location.href = paths.APP
  }

  logout = () => {
    localStorage.removeItem(LS_AUTH_TOKENS)

    location.href = paths.SIGNIN
  }

  // --- user management

  updateUser = action(this.loggedInUser, 'updateUser', async (store, updates: Partial<User>) => {
    logger.info(`AUTH —— Update User`, updates)
    const response = await API.updateUser(updates)
    store.set(User.fromJSON(response.user))
  })
}

export const authStore = new AuthStore()
if (config.dev) (window as any)['authStore'] = authStore
