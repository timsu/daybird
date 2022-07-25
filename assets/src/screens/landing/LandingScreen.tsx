import LandingLayout from '@/components/layout/LandingLayout'
import { hasToken, paths } from '@/config'
import Hero from '@/screens/landing/Hero'
import HeroScreenshot from '@/screens/landing/HeroScreenshot'

type Props = {
  path: string
}

export default (props: Props) => {
  if (hasToken()) location.href = paths.APP

  return (
    <LandingLayout darkFooter>
      <main className="mx-auto max-w-7xl px-4 sm:mt-24 grow">
        <Hero />
      </main>

      <HeroScreenshot />
    </LandingLayout>
  )
}
