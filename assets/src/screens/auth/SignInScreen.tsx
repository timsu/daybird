import LandingLayout from '@/components/layout/LandingLayout'
import SignInForm from '@/screens/auth/SignInForm'
import { Helmet } from '@notwoods/preact-helmet'

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
