export default function WhyDaybird() {
  return (
    <div className="relative overflow-hidden bg-white py-16">
      <div className="hidden lg:absolute lg:inset-y-0 lg:block lg:h-full lg:w-full lg:[overflow-anchor:none]">
        <div className="relative mx-auto h-full max-w-prose text-lg" aria-hidden="true">
          <svg
            className="absolute top-12 left-full translate-x-32 transform"
            width={404}
            height={384}
            fill="none"
            viewBox="0 0 404 384"
          >
            <defs>
              <pattern
                id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x={0}
                  y={0}
                  width={4}
                  height={4}
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width={404} height={384} fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />
          </svg>
          <svg
            className="absolute top-1/2 right-full -translate-y-1/2 -translate-x-32 transform"
            width={404}
            height={384}
            fill="none"
            viewBox="0 0 404 384"
          >
            <defs>
              <pattern
                id="f210dbf6-a58d-4871-961e-36d5016a0f49"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x={0}
                  y={0}
                  width={4}
                  height={4}
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width={404} height={384} fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />
          </svg>
          <svg
            className="absolute bottom-12 left-full translate-x-32 transform"
            width={404}
            height={384}
            fill="none"
            viewBox="0 0 404 384"
          >
            <defs>
              <pattern
                id="d3eb07ae-5182-43e6-857d-35c643af9034"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x={0}
                  y={0}
                  width={4}
                  height={4}
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width={404} height={384} fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />
          </svg>
        </div>
      </div>
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-prose text-lg text-gray-500">
          <h1>
            <span className="block text-center text-lg font-semibold text-lavender-700">
              Why Daybird?
            </span>
            <span className="mt-2 block text-center text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              Peaceful Productivity
            </span>
          </h1>
          <p className="mt-8 text-xl leading-8">
            Daybird exists to empower a specific workflow: daily planning with a journal. If you’ve
            tried Bullet Journal, you’ll be familiar with the method — every day you start with a
            blank page and figure out what to do.
          </p>
          <p className="mt-8 leading-8">
            There are a lot of note-taking and task-management apps out there, but Daybird is
            designed to guide you toward staying in control of your day rather than reacting to
            incoming requests and lists of things you didn't get to.
          </p>
          <p className="mt-4 leading-8">
            If you struggle with feeling overwhelmed, you might benefit from the calm of having a
            blank page every day. You can decide to carry over incomplete tasks from previous days,
            but you may also find that many tasks are better left un-done.
          </p>
          <p className="mt-4 leading-8">
            Daybird is built by{' '}
            <a href="https://timsu.org" target="_blank" className="text-lavender-500 font-semibold">
              Tim Su
            </a>{' '}
            and is open-source software, so you can also host it yourself or customize it to fit
            your workflow better.
          </p>
        </div>
      </div>
    </div>
  )
}
