import Router from 'preact-router'

import { paths } from '@/config'
import SignInScreen from '@/screens/auth/SignInScreen'
import SignUpScreen from '@/screens/auth/SignUpScreen'

export default () => (
  <Router>
    <SignInScreen path={paths.SIGNIN} />
    <SignUpScreen path={paths.SIGNUP} />
  </Router>
)
