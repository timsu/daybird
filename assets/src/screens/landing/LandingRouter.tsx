import Router from 'preact-router'

import { paths } from '@/config'
import LandingScreen from '@/screens/landing/LandingScreen'
import Privacy from '@/screens/landing/Privacy'
import Terms from '@/screens/landing/Terms'

export default () => (
  <Router>
    <LandingScreen path={paths.ROOT} />
    <Terms path={paths.TERMS} />
    <Privacy path={paths.PRIVACY} />
  </Router>
)
