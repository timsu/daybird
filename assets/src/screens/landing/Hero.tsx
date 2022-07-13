import paths from '@/config/paths'

export default () => (
  <main className="mx-auto max-w-7xl px-4 sm:mt-24">
    <div className="text-center">
      <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
        <span className="block xl:inline">Tasks and notes</span>{' '}
        <span className="block text-blue-600 xl:inline">belong together</span>
      </h1>
      <p className="mt-6 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        Break free from rigid project management tools. Plan projects and collaborate on notes with
        powerful embedded tasks that can be searched and sorted.
        <div className="h-4" />
        Work more effectively when context is paired with action.
      </p>
      <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
        <div className="rounded-md shadow">
          <a
            href={paths.SIGNUP}
            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
          >
            Try it for yourself
          </a>
        </div>
      </div>
    </div>
  </main>
)
