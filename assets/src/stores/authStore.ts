import { atom, onMount } from 'nanostores'

import { User } from '@/models'

const LS_AUTH_TOKENS = 'at'

export const loggedInUser = atom<User | null | undefined>()

onMount(loggedInUser, () => {
  console.log('loading user')
  const tokens = localStorage.getItem(LS_AUTH_TOKENS)

  if (tokens) loginHelper(tokens)
  else loggedInUser.set(null)
})

const loginHelper = async (tokens: string) => {}
