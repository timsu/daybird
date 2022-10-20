import Button from '@/components/core/Button'
import LandingLayout from '@/components/layout/LandingLayout'
import { hasToken, paths } from '@/config'
import bird_calendar from '@/images/bird-calendar.jpg'
import Features from '@/screens/landing/Features'
import Hero from '@/screens/landing/Hero'

type Props = {
  path: string
}

export default (props: Props) => {
  if (hasToken() && location.search != '?stay') {
    location.href = paths.TODAY
  }

  return (
    <LandingLayout darkFooter>
      <main className="">
        <Hero />

        <Features />

        <div className="flex flex-col items-center mt-10 mb-32">
          <img src={bird_calendar} />
          <div className="text-sm my-4">Let's make magic happen.</div>

          <Button onClick={() => (location.href = paths.SIGNUP)}>Get Started!</Button>
        </div>
      </main>
    </LandingLayout>
  )
}
