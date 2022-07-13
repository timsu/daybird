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

  // --- login

  loginHelper = async (givenTokens: AuthTokenPair) => {
    const tokens = await API.exchangeAndSetAuthToken(givenTokens)

    // todo: get user info
  }

  saveTokens = async (tokens: AuthTokenPair) => {
    logger.info('AUTH —— saving tokens', tokens)
    await localStorage.setItem(LS_AUTH_TOKENS, JSON.stringify(tokens))
  }

  updateTokens = action(this.authTokens, 'updateTokens', (store, tokens: AuthTokenPair) => {
    store.set(tokens)
    if (tokens.refresh?.token) this.saveTokens(tokens)
  })

  // --- account creation

  createAccount = async (name: string, email: string, password: string) => {
    logger.info('AUTH —— create account', name, email)
    const response = await API.createAccount(name, email, password)
    const tokens = { refresh: { token: response.token! } }
    this.saveTokens(tokens)

    location.href = paths.APP
  }
}

export const authStore = new AuthStore()
if (config.dev) (window as any)['authStore'] = authStore

// --- triggered actions

onMount(authStore.loggedInUser, () => {
  console.log('loading user')
  const tokens = localStorage.getItem(LS_AUTH_TOKENS)

  if (tokens) authStore.loginHelper(JSON.parse(tokens))
  else authStore.loggedInUser.set(null)
})
