import { format } from 'date-fns'
import { route } from 'preact-router'

import Helmet from '@/components/core/Helmet'
import AppHeader from '@/components/layout/AppHeader'
import { paths } from '@/config'
import StatsMonth from '@/screens/insight/StatsMonth'

type Props = {
  path: string
}

export default (props: Props) => {
  const navToDate = (date: Date) => {
    route(paths.JOURNAL + '?d=' + format(date, 'yyyy-MM-dd'))
  }

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

      <div class="flex flex-col grow w-full px-4 sm:px-6 max-w-4xl items-center">
        <div class="w-full sm:w-[350px]">
          <StatsMonth
            className="text-sm sm:text-base"
            onSelect={navToDate}
            gridClassName="gap-y-[12px]"
          />
        </div>

        <div class="text-3xl text-center my-8">Start journaling to start a new streak.</div>

        <div class="text-center">Habits are built in small amounts - one day at a time.</div>
      </div>
    </>
  )
}
