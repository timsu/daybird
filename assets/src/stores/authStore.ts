import { User } from '@/models'

import { atom, onMount } from 'nanostores'

export const loggedInUser = atom<User | null | undefined>()

onMount(loggedInUser, () => {
  console.log('loading user')
  loggedInUser.set(null)
})
