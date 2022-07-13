import LandingLayout from '@/components/layout/LandingLayout'
import RegisterForm from '@/screens/auth/RegisterForm'
import { Helmet } from '@notwoods/preact-helmet'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <LandingLayout>
      <Helmet title="Sign up" />
      <RegisterForm />
    </LandingLayout>
  )
}
