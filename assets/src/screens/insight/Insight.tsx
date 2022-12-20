import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Loader from '@/components/core/Loader'
import AppLayout from '@/components/layout/AppLayout'
import { paths } from '@/config'
import InsightRouter from '@/screens/insight/InsightRouter'
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
      location.href = paths.INSIGHT_SIGNUP + '?path=' + location.pathname + location.search
    else {
      uiStore.initLoggedInUser(user)
      tracker.openJournal()
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
    <AppLayout>
      <InsightRouter />
    </AppLayout>
  )
}
