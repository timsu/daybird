import Button from '@/components/core/Button'
import { paths } from '@/config'
import bird_calendar from '@/images/bird-calendar.jpg'

export default function FooterCTA() {
  return (
    <div className="flex flex-col items-center mt-10 mb-32">
      <img src={bird_calendar} />
      <div className="m-8 text-center">
        Daybird is free for personal use. Let's make magic happen!
      </div>

      <Button class="text-xl px-20 py-4" onClick={() => (location.href = paths.SIGNUP)}>
        Get Started!
      </Button>
    </div>
  )
}
