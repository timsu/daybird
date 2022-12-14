import { useState } from 'preact/hooks'

import Helmet from '@/components/core/Helmet'
import AppHeader from '@/components/layout/AppHeader'
import { Period } from '@/models'
import DailyNoteList from '@/screens/insight/DailyNoteList'
import { classNames, toTitleCase } from '@/utils'

type Props = {
  path: string
}

export default (props: Props) => {
  const [period, setPeriod] = useState(Period.WEEK)

  return (
    <>
      <Helmet title={toTitleCase(period + 'ly') + ' Insights'} />

      <AppHeader>
        <div class="flex flex-1 gap-2 items-center relative overflow-hidden">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
            Insights
          </h1>
        </div>
      </AppHeader>

      <div class="flex flex-col grow w-full px-2 sm:px-6 max-w-4xl">
        <div class="flex">
          {[Period.WEEK, Period.MONTH, Period.YEAR].map((p) => (
            <div
              class={classNames(
                'flex-1 sm:max-w-[12rem] p-4 border-b text-sm font-bold text-center hover:bg-gray-200 cursor-pointer',
                'tracking-wide select-none',
                p == period ? 'border-b-blue-400 text-blue-400' : ''
              )}
              onClick={() => setPeriod(p)}
            >
              {p.toLocaleUpperCase()}
            </div>
          ))}
        </div>

        <DailyNoteList period={period} />
      </div>
    </>
  )
}
