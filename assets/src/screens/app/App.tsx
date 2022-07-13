import Loader from '@/components/core/Loader'
import Login from '@/screens/app/Login'
import { loggedInUser } from '@/stores/authStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(loggedInUser)

  console.log('my user', user)
  if (user === undefined) return <Loader class="mx-auto my-40" size={80} />

  return (
    <div class="m-8">
      <div class="text-xl font-bold">
        <a href="/">SEQUENCE</a>
      </div>

      <hr class="my-4" />

      <div class="my-4">The app.</div>

      <Login />
    </div>
  )
}
