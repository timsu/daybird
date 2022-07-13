import LandingLayout from '@/components/layout/LandingLayout'
import Hero from '@/screens/landing/Hero'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <LandingLayout>
      <Hero />
    </LandingLayout>
  )
}
