import screenshot from '@/images/screenshot.png'

export default () => (
  <div className="relative">
    <div className="absolute inset-0 flex flex-col" aria-hidden="true">
      <div className="flex-1" />
      <div className="flex-1 w-full bg-slate-900" />
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <img className="relative rounded-lg shadow-lg" src={screenshot} alt="App screenshot" />
    </div>
  </div>
)
