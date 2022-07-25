import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Loader from '@/components/core/Loader'
import AppLayout from '@/components/layout/AppLayout'
import { paths } from '@/config'
import AppRouter from '@/screens/app/AppRouter'
import { authStore } from '@/stores/authStore'
import { useStore } from '@nanostores/preact'

const hotModuleReloadId = Math.random()

export default () => {
  useState(hotModuleReloadId)
  const user = useStore(authStore.loggedInUser)

  useEffect(() => {
    if (user === null) location.href = paths.SIGNIN
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
