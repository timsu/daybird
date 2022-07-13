import Loader from '@/components/core/Loader'
import LandingLayout from '@/components/layout/LandingLayout'
import Login from '@/screens/auth/SignInScreen'
import { loggedInUser } from '@/stores/authStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(loggedInUser)

  console.log('my user', user)
  if (user === undefined) return <Loader class="mx-auto my-40" size={80} />

  return (
    <LandingLayout>
      <div class="text-xl">APP</div>
    </LandingLayout>
  )
}
