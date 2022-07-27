import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Loader from '@/components/core/Loader'
import AppLayout from '@/components/layout/AppLayout'
import { paths } from '@/config'
import AppRouter from '@/screens/app/AppRouter'
import { authStore } from '@/stores/authStore'
import { logger } from '@/utils'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(authStore.loggedInUser)

  useEffect(() => {
    if (user === undefined) authStore.init()
    else if (user === null) location.href = paths.SIGNIN
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
