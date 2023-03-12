import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Loader from '@/components/core/Loader'
import { paths } from '@/config'
import ChatMain from '@/screens/addie/ChatMain'
import { authStore } from '@/stores/authStore'
import tracker from '@/stores/tracker'
import { uiStore } from '@/stores/uiStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(authStore.loggedInUser)

  useEffect(() => {
    uiStore.insightLoop = true
    if (user === undefined) authStore.init()
    else if (user === null)
      location.href = paths.SIGNUP + '?path=' + location.pathname + location.search
    else {
      uiStore.initLoggedInUser(user)
      tracker.openAddie()
    }
  }, [user])

  if (!user)
    return (
      <div class="w-10 mx-auto my-40">
        <Loader class="my-40" size={80} />
        <Button onClick={() => location.reload()}>Refresh</Button>
      </div>
    )

  return (
    <div class="w-full h-full min-w-[300px] bg-gray-100">
      <ChatMain />
    </div>
  )
}
