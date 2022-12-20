import Helmet from '@/components/core/Helmet'
import InsightSignUpLayout from '@/components/layout/InsightSignUpLayout'
import InsightSignInForm from '@/screens/auth/InsightSignInForm'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <InsightSignUpLayout>
      <Helmet title="Login" />
      <InsightSignInForm />
    </InsightSignUpLayout>
  )
}
