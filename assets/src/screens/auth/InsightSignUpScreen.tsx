import Helmet from '@/components/core/Helmet'
import InsightSignUpLayout from '@/components/layout/InsightSignUpLayout'
import LandingLayout from '@/components/layout/LandingLayout'
import SignInForm from '@/screens/auth/SignInForm'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <InsightSignUpLayout>
      <Helmet title="Sign up" />
      <h1>INSIGHT LOOP</h1>
      <SignInForm />
    </InsightSignUpLayout>
  )
}
