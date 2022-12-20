import Router from 'preact-router'

import { paths } from '@/config'
import InsightSignUpScreen from '@/screens/auth/InsightSignUpScreen'
import SignInScreen from '@/screens/auth/SignInScreen'
import SignUpScreen from '@/screens/auth/SignUpScreen'

export default () => (
  <Router>
    <SignInScreen path={paths.SIGNIN} />
    <SignUpScreen path={paths.SIGNUP} />
    <InsightSignUpScreen path={paths.INSIGHT_SIGNIN} />
    <InsightSignUpScreen path={paths.INSIGHT_SIGNUP} />
  </Router>
)
