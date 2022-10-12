import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Loader from '@/components/core/Loader'
import AppLayout from '@/components/layout/AppLayout'
import { paths } from '@/config'
import AppRouter from '@/screens/app/AppRouter'
import { authStore } from '@/stores/authStore'
import { LS_LAST_DOC } from '@/stores/docStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(authStore.loggedInUser)

  useEffect(() => {
    if (user === undefined) authStore.init()
    else if (user === null) location.href = paths.SIGNIN
    else {
      uiStore.initLoggedInUser(user)

      if (location.pathname == paths.APP) {
        const lastDoc = localStorage.getItem(LS_LAST_DOC)
        if (lastDoc) {
          const [projectId, _docId] = lastDoc.split('/')
          projectStore.setCurrentProject(projectId)
        }
        route(paths.TODAY)
      }
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
      <AppRouter />
    </AppLayout>
  )
}
