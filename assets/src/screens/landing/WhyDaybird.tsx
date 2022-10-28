export default function WhyDaybird() {
  return (
    <div className="relative overflow-hidden bg-white py-16">
      <div className="hidden lg:absolute lg:inset-y-0 lg:block lg:h-full lg:w-full lg:[overflow-anchor:none]">
        <div className="relative mx-auto h-full max-w-prose text-lg" aria-hidden="true">
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
      <div className="relative md:px-6">
        <div className="mx-auto max-w-prose text-lg text-white bg-lavender-700 p-8 sm:p-12 md:rounded-lg">
          <h1>
            <span className="mt-2 block text-center text-2xl font-bold leading-8 tracking-tight text-white sm:text-3xl">
              Why Daybird?
            </span>
          </h1>
          <p className="mt-8 text-xl leading-8">
            Daybird exists to empower a specific workflow: daily planning with a journal. If you’ve
            tried Bullet Journal, you’ll be familiar with the method of starting every day with a
            blank page to fill.
          </p>
          <p className="mt-8 leading-8">
            Unlike other productivity tools, Daybird helps you stay in control of your time. You can
            decide to carry over incomplete tasks from previous days, but you may also find that
            many tasks are better left un-done.
          </p>
          <p className="mt-4 leading-8">
            Daybird is built by{' '}
            <a href="https://timsu.org" target="_blank" className="text-lavender-300 font-semibold">
              Tim Su
            </a>{' '}
            (creator of{' '}
            <a
              href="https://en.wikipedia.org/wiki/Astrid_(application)"
              target="_blank"
              className="font-semibold"
            >
              Astrid
            </a>
            ) and is open-source software, so you can also host it yourself or customize it to fit
            your workflow better.
          </p>
        </div>
      </div>
    </div>
  )
}
