import Router from 'preact-router'

import paths from '@/config/paths'
import SignInScreen from '@/screens/auth/SignInScreen'
import SignUpScreen from '@/screens/auth/SignUpScreen'
import LandingScreen from '@/screens/landing/LandingScreen'

export default () => (
  <Router>
    <LandingScreen path={paths.ROOT} />
    <SignInScreen path={paths.SIGNIN} />
    <SignUpScreen path={paths.SIGNUP} />
  </Router>
)
