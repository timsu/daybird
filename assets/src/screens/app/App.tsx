import Router from 'preact-router'

import Loader from '@/components/core/Loader'
import AppLayout from '@/components/layout/AppLayout'
import { paths } from '@/config'
import Dashboard from '@/screens/app/Dashboard'
import Doc from '@/screens/app/Doc'
import Projects from '@/screens/app/Projects'
import { authStore } from '@/stores/authStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const user = useStore(authStore.loggedInUser)

  console.log('my user', user)

  if (user === null) location.href = paths.SIGNIN

  if (!user) return <Loader class="mx-auto my-40" size={80} />

  return (
    <AppLayout>
      <Router>
        <Dashboard path={paths.APP} />
        <Projects path={paths.PROJECTS} />
        <Doc path={paths.DOC} />
      </Router>
    </AppLayout>
  )
}
