import Loader from '@/components/core/Loader'
import AppLayout from '@/components/layout/AppLayout'
import { paths } from '@/config'
import AppRouter from '@/screens/app/AppRouter'
import { authStore } from '@/stores/authStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(authStore.loggedInUser)

  if (user === null) location.href = paths.SIGNIN

  if (!user) return <Loader class="mx-auto my-40" size={80} />

  return (
    <AppLayout>
      <AppRouter />
    </AppLayout>
  )
}
