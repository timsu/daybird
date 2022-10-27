import Logo from '@/components/core/Logo'
import Tooltip from '@/components/core/Tooltip'
import { paths } from '@/config'
import github from '@/images/github.png'
import screenshot from '@/images/screenshot.png'

export default () => (
  <>
    <div className="lg:relative lg:py-20/ bg-lavender-50 overflow-hidden">
      <div
        className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:grid lg:max-w-7xl
          lg:grid-cols-2 lg:gap-24 lg:px-8"
      >
        <div>
          <div>
            <Logo class="w-[150px] sm:w-[250px] mx-auto" />
          </div>
          <div className="my-20">
            <div className="mt-6 sm:max-w-xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl text-center lg:text-left">
                <div className="">Daily Planner with</div>
                <div className="text-lavender-600">notes, tasks, and calendar</div>
              </h1>
              <p className="mt-6 text-xl text-gray-500 leading-normal">
                Daybird is the premier daily journal for creative thinkers and teams. Take control
                of your day and decide what is important.
              </p>
              <div className="mt-10 flex flex-col items-center">
                <a
                  href={paths.SIGNUP}
                  className="mx-auto px-8 py-3 border border-transparent
            text-base font-medium rounded-md text-white bg-lavender-600 hover:bg-lavender-800
            md:py-4 md:text-lg md:px-10"
                >
                  Try it for yourself
                </a>

                <div className="mt-10">
                  <a
                    className="text-gray-800 hover:bg-lavender-100 p-2 rounded-md flex items-center"
                    href="https://github.com/timsu/daybird"
                    target="_blank"
                  >
                    <img src={github} width={32} height={32} />
                    <div className="ml-2 text-">Daybird is Open Source!</div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:max-w-3xl sm:px-6">
        <div className="sm:relative sm:mt-12 sm:py-16 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="hidden sm:block">
            <div className="absolute inset-y-0 left-1/2 w-screen rounded-l-3xl bg-gray-50 lg:left-80 lg:right-0 lg:w-full" />
            <svg
              className="absolute top-8 right-1/2 -mr-3 lg:left-0 lg:m-0"
              width={404}
              height={392}
              fill="none"
              viewBox="0 0 404 392"
            >
              <defs>
                <pattern
                  id="837c3e70-6c3a-44e6-8854-cc48c737b659"
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
                    className="text-gray-300"
                    fill="currentColor"
                  />
                </pattern>
              </defs>
              <rect width={404} height={392} fill="url(#837c3e70-6c3a-44e6-8854-cc48c737b659)" />
            </svg>
          </div>
          <div className="relative -mr-40 pl-4 sm:mx-auto sm:max-w-3xl sm:px-0 lg:h-full lg:max-w-none lg:pl-12">
            <img
              className="w-full rounded-md lg:h-full lg:w-auto lg:max-w-none"
              src={screenshot}
              alt="Screenshot"
            />
          </div>
        </div>
      </div>
    </div>
  </>
)
