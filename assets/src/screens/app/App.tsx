import Loader from '@/components/core/Loader'
import LandingLayout from '@/components/layout/LandingLayout'
import { paths } from '@/config'
import { authStore } from '@/stores/authStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(authStore.loggedInUser)

  console.log('my user', user)

  if (user === null) location.href = paths.SIGNIN

  if (!user) return <Loader class="mx-auto my-40" size={80} />

  return (
    <LandingLayout>
      <div class="text-xl">APP</div>
    </LandingLayout>
  )
}
