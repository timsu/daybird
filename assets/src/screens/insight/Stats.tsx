import { format, sub } from 'date-fns'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import { API } from '@/api'
import Helmet from '@/components/core/Helmet'
import AppHeader from '@/components/layout/AppHeader'
import { paths } from '@/config'
import { dateToPeriodDateString, Period } from '@/models'
import StatsMonth from '@/screens/insight/StatsMonth'
import { projectStore } from '@/stores/projectStore'
import { pluralize } from '@/utils'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const project = useStore(projectStore.currentProject)
  const [past30Count, setPast30Count] = useState<number>()

  const navToDate = (date: Date) => {
    route(paths.JOURNAL + '?d=' + format(date, 'yyyy-MM-dd'))
  }

  useEffect(() => {
    if (!project) return
    const today = new Date()
    const period = Period.DAY
    const start = dateToPeriodDateString(period, sub(today, { months: 1 }))
    const end = dateToPeriodDateString(period, today)
    API.listNotes(project, period, start, end).then((response) =>
      setPast30Count(response.notes.length)
    )
  }, [project?.id])

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
        <div class="w-full sm:w-[400px]">
          <StatsMonth
            className="text-sm sm:text-base"
            onSelect={navToDate}
            gridClassName="gap-y-[12px]"
          />
        </div>

        {past30Count !== undefined && (
          <div class="text-3xl text-center mt-8">
            {past30Count == 0 ? (
              <>You haven't journaled in the past 30 days</>
            ) : (
              <>
                You've journaled <span class="text-blue-500">{past30Count}</span>{' '}
                {pluralize('time', past30Count || 0)} in the past 30 days. Keep it up!
              </>
            )}
          </div>
        )}

        <div class="text-center mt-8">Habits are built in small amounts - one day at a time.</div>
      </div>
    </>
  )
}
