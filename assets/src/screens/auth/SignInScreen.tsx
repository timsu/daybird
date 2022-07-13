import Helmet from '@/components/core/Helmet'
import LandingLayout from '@/components/layout/LandingLayout'
import SignInForm from '@/screens/auth/SignInForm'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <LandingLayout>
      <Helmet title="Sign in" />
      <SignInForm />
    </LandingLayout>
  )
}
