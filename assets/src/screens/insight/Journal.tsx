import { sub } from 'date-fns'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import { API } from '@/api'
import Helmet from '@/components/core/Helmet'
import Pressable from '@/components/core/Pressable'
import AppHeader from '@/components/layout/AppHeader'
import { paths } from '@/config'
import { dateToPeriodDateString, Period } from '@/models'
import DailyNoteList from '@/screens/insight/DailyNoteList'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const notes = useStore(journalStore.notes)
  const [needsInsight, setNeedsInsight] = useState(false)

  useEffect(() => {
    // on any day other than Sunday, you'll see notes from the previous week
    const today = new Date()
    const thisDay = today.getDay()
    if (thisDay == 0 || !notes) return

    const lastWeek = sub(new Date(), { days: thisDay })
    const lastWeekInsight = dateToPeriodDateString(Period.WEEK, lastWeek)
    logger.info('looking back at prev week', lastWeek, lastWeekInsight)
    if (notes[lastWeekInsight]) return

    const hasPreviousWeekEntry = [0, 1, 2, 3, 4, 5].find((d) => {
      const entry = dateToPeriodDateString(Period.DAY, sub(lastWeek, { days: d }))
      return Boolean(notes[entry])
    })
    logger.info('has old entry?', hasPreviousWeekEntry)
    if (hasPreviousWeekEntry === undefined) return

    journalStore
      .loadNotes(projectStore.currentProject.get()!, Period.WEEK, lastWeekInsight, lastWeekInsight)
      .then((response) => {
        logger.info('loaded insight', response)
        if (!response?.length) setNeedsInsight(true)
      })
  }, [notes])

  return (
    <>
      <Helmet title={'Daily Journal'} />

      <AppHeader>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
          Daily Journal
        </h1>
      </AppHeader>

      <div class="flex flex-col grow w-full px-2 sm:px-6 max-w-4xl">
        {needsInsight && (
          <Pressable
            className="m-4 bg-yellow-100 rounded-md border-yellow-300 border p-4"
            onClick={() => route(location.pathname.replace('journal', 'insights'))}
          >
            What stood out to you about last week? ➡️
          </Pressable>
        )}
        <DailyNoteList period={Period.DAY} />
      </div>
    </>
  )
}
