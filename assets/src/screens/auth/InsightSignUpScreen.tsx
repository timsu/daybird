import Helmet from '@/components/core/Helmet'
import InsightSignUpLayout from '@/components/layout/InsightSignUpLayout'
import InsightRegisterForm from '@/screens/auth/InsightRegisterForm'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <InsightSignUpLayout>
      <Helmet title="Sign up" />
      <InsightRegisterForm />
    </InsightSignUpLayout>
  )
}
