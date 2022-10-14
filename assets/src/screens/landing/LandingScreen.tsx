import LandingLayout from '@/components/layout/LandingLayout'
import { hasToken, paths } from '@/config'
import Hero from '@/screens/landing/Hero'
import HeroScreenshot from '@/screens/landing/HeroScreenshot'
import { LS_LAST_DOC } from '@/stores/docStore'

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
      </main>

      {/* <HeroScreenshot /> */}
    </LandingLayout>
  )
}
