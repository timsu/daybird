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
    const lastDoc = localStorage.getItem(LS_LAST_DOC)
    if (lastDoc) location.href = `${paths.DOC}/${lastDoc}`
    else location.href = paths.APP
  }

  return (
    <LandingLayout darkFooter>
      <main className="mx-auto max-w-7xl px-4 sm:mt-24 grow">
        <Hero />
      </main>

      <HeroScreenshot />
    </LandingLayout>
  )
}
