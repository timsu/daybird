import { action, atom, onMount } from 'nanostores'

import { API } from '@/api'
import { config, paths } from '@/config'
import { AuthTokenPair, User } from '@/models'
import { logger } from '@/utils'

const LS_AUTH_TOKENS = 'at'

class AuthStore {
  // --- stores

  loggedInUser = atom<User | null | undefined>()

  authTokens = atom<AuthTokenPair | undefined>()

  // --- initialization

  loginHelper = async (givenTokens: AuthTokenPair) => {
    const tokens = await API.exchangeAndSetAuthToken(givenTokens)
    const { access, refresh } = tokens || {}
    if (!tokens?.access) throw 'Tokens were invalid'

    const response = await API.getUser()
    logger.info('AUTH - logged in', response)

    if (
      tokens &&
      (refresh?.token != givenTokens.refresh?.token || access?.token != givenTokens.access?.token)
    ) {
      this.saveTokens(tokens)
    }

    this.loggedInUser.set(User.fromJSON(response.user))
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
  }
}

export const authStore = new AuthStore()
if (config.dev) (window as any)['authStore'] = authStore

// --- triggered actions

onMount(authStore.loggedInUser, () => {
  const tokens = localStorage.getItem(LS_AUTH_TOKENS)

  if (tokens) {
    authStore.loginHelper(JSON.parse(tokens)).catch((e) => {
      logger.warn(e)
      authStore.loggedInUser.set(null)
    })
  } else authStore.loggedInUser.set(null)
})
