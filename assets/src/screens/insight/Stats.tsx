import Helmet from '@/components/core/Helmet'
import AppHeader from '@/components/layout/AppHeader'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <>
      <Helmet title={'Stats'} />

      <AppHeader>
        <div class="flex flex-1 gap-2 items-center relative overflow-hidden">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
            Stats
          </h1>
        </div>
      </AppHeader>

      <div class="flex flex-col grow w-full px-6 mt-4 max-w-2xl">Coming soon.</div>
    </>
  )
}
