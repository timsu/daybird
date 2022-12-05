import { format, subDays } from 'date-fns'
import { useState } from 'preact/hooks'

import Helmet from '@/components/core/Helmet'
import AppHeader from '@/components/layout/AppHeader'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <>
      <Helmet title={'Daily Journal'} />

      <AppHeader>
        <div class="flex flex-1 gap-2 items-center relative overflow-hidden">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
            Daily Journal
          </h1>
        </div>
      </AppHeader>

      <div class="flex flex-col grow w-full px-6 mt-4 max-w-2xl">
        <JournalDays />
      </div>
    </>
  )
}

function JournalDays() {
  const [dayCount, setDayCount] = useState(14)

  const days = Array(dayCount).fill(0)
  const today = new Date()

  return (
    <>
      {days.map((_, d) => {
        const date = subDays(today, -d)
        const title = format(date, 'yyyy-MM-dd')
        const dayName = format(date, 'EEEE')
        const localeDate = format(date, 'P')
        const isToday = d == 0

        return (
          <div class="border-b p-4">
            <div class="flex justify-between">
              <div class="font-bold">
                {dayName}
                {isToday && ' (Today)'}
              </div>
              <div class="opacity-50">{localeDate}</div>
            </div>
            <div class="opacity-50 italic">No journal entry for this day</div>
          </div>
        )
      })}
    </>
  )
}
