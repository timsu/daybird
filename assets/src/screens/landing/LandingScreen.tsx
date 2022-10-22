import LandingLayout from '@/components/layout/LandingLayout'
import { hasToken, paths } from '@/config'
import Features from '@/screens/landing/Features'
import FooterCTA from '@/screens/landing/FooterCTA'
import Hero from '@/screens/landing/Hero'
import Pricing from '@/screens/landing/Pricing'
import WhyDaybird from '@/screens/landing/WhyDaybird'

type Props = {
  path: string
}

export default (props: Props) => {
  if (hasToken() && location.search != '?stay') {
    location.href = paths.TODAY
  }

  return (
    <LandingLayout darkFooter>
      <main className="flex flex-col grow ">
        <Hero />

        <WhyDaybird />

        <Features />

        <FooterCTA />
      </main>
    </LandingLayout>
  )
}
