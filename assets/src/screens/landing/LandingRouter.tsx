import Router from 'preact-router'

import { paths } from '@/config'
import LandingScreen from '@/screens/landing/LandingScreen'

export default () => (
  <Router>
    <LandingScreen path={paths.ROOT} />
  </Router>
)
