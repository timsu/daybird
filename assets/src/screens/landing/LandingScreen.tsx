import LandingLayout from '@/components/layout/LandingLayout'
import { hasToken, paths } from '@/config'
import Features from '@/screens/landing/Features'
import Hero from '@/screens/landing/Hero'

type Props = {
  path: string
}

export default (props: Props) => {
  if (hasToken()) {
    location.href = paths.TODAY
  }

  return (
    <LandingLayout darkFooter>
      <main className="">
        <Hero />

        <Features />
      </main>
    </LandingLayout>
  )
}
