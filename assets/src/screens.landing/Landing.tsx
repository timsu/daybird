import Logo from '@/components/core/Logo'

export default function Landing() {
  return (
    <div class="m-8">
      <div class="text-xl font-bold">SEQUENCE</div>

      <div class="text-l">A modern way to work</div>

      <hr class="my-4" />

      <div class="my-4">
        Break free from traditional project management by putting documents and tasks together.
      </div>

      <div class="my-4">
        Plan projects and take meeting notes with powerful embedded tasks that can be searched and
        sorted.
      </div>

      <div class="my-4">
        Collaborate and work more effectively when context is paired with action.
      </div>

      <div class="my-8">
        <a href="/app" class="p-4 rounded-md bg-blue-700 hover:bg-blue-600 text-white">
          Get Started
        </a>
      </div>
    </div>
  )
}
