import Tooltip from '@/components/core/Tooltip'
import { paths } from '@/config'
import github from '@/images/github.png'

export default () => (
  <div className="text-center mb-32">
    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
      <span className="block xl:inline mb-2">Tasks and notes</span>{' '}
      <span className="block text-funblue-600 xl:inline">belong together</span>
    </h1>
    <p className="my-10 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:text-xl md:max-w-3xl">
      Break free from rigid project management tools. Plan projects and collaborate on notes with
      powerful embedded tasks that can be searched and sorted.
      <div className="h-4" />
      Work better by working your way.
    </p>
    <div className="mt-4 mb-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
      <div className="rounded-md shadow">
        <a
          href={paths.SIGNUP}
          className="w-full flex items-center justify-center px-8 py-3 border border-transparent
            text-base font-medium rounded-md text-white bg-funblue-600 hover:bg-funblue-700
            md:py-4 md:text-lg md:px-10"
        >
          Try it for yourself
        </a>
      </div>
    </div>
    <div className="mt-4 mb-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
      <Tooltip message="Check out ListNote on Github" placement="bottom" tooltipClass="w-[220px]">
        <a
          className="text-funblue-600 underline"
          href="https://github.com/timsu/listnote"
          target="_blank"
        >
          <img src={github} width={32} height={32} />
        </a>
      </Tooltip>
    </div>
  </div>
)
