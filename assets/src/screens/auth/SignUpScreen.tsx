import Helmet from '@/components/core/Helmet'
import LandingLayout from '@/components/layout/LandingLayout'
import RegisterForm from '@/screens/auth/RegisterForm'

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
