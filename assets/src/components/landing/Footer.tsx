export default function ({ dark }: { dark?: boolean }) {
  return (
    <footer className={dark ? 'bg-slate-900' : 'bg-white'}>
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <img src="/images/icon-48.png" width={48} height={48} class="mx-auto" />
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; 2022 Bridge to the Future LLC. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
