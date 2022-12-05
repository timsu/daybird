import {
    add, addDays, format, isAfter, isBefore, isSameDay, parse, startOfDay, sub, subDays
} from 'date-fns'
import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import Loader from '@/components/core/Loader'
import DailyNote from '@/components/editor/DailyNote'
import MiniEditor from '@/components/editor/MiniEditor'
import AppHeader from '@/components/layout/AppHeader'
import { endOfDatePeriod, Insight, Period } from '@/models'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import { classNames, logger, toTitleCase } from '@/utils'
import { PencilIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

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

      <div class="flex flex-col grow w-full px-6 max-w-2xl">
        <div class="flex">
          {[Period.WEEK, Period.MONTH, Period.YEAR].map((p) => (
            <div
              class={classNames(
                'w-32 p-4 border-b text-sm font-bold text-center hover:bg-gray-200 cursor-pointer',
                'tracking-wide select-none',
                p == period ? 'border-b-blue-400 text-blue-400' : ''
              )}
              onClick={() => setPeriod(p)}
            >
              {p.toLocaleUpperCase()}
            </div>
          ))}
        </div>

        <InsightList period={period} />
      </div>
    </>
  )
}

function InsightList({ period }: { period: Period }) {
  const project = useStore(projectStore.currentProject)
  const insights = {}

  const lookBack = 6

  const params = new URLSearchParams(location.search)
  const dateParam = params.get('d')
  let endDate: Date = new Date()
  try {
    if (dateParam) endDate = parse(dateParam, 'yyyy-MM-dd', new Date())
  } catch (e) {
    logger.info(e)
  }

  const entries = Array(lookBack).fill(0)
  const today = new Date()
  const [editingDate, setEditingDate] = useState(format(today, 'yyyy-MM-dd'))

  useEffect(() => {
    if (!project) return
    // const start = format(subDays(endDate, dayCount), 'yyyy-MM-dd')
    // const end = format(endDate, 'yyyy-MM-dd')
    // journalStore.loadNotes(project, start, end)
  }, [project, endDate])

  if (!project || !insights) return <Loader class="mx-auto" />

  const iteration = (n: number) =>
    period == Period.WEEK ? { weeks: n } : period == Period.MONTH ? { months: n } : { years: n }

  return (
    <>
      {entries.map((_, i) => {
        const partialDate = sub(endDate, iteration(i))
        const date = endOfDatePeriod(period, partialDate)
        const title = toTitleCase(period) + ' ending ' + format(date, 'P')
        const isThisPeriod = isBefore(today, date) && isAfter(today, sub(date, iteration(1)))
        const insight: Insight | undefined = undefined

        return (
          <div class="border-b p-4">
            <div class="flex justify-between">
              <div class="font-bold">
                {title}
                {isThisPeriod && ` (this ${period})`}
              </div>
              <div class="opacity-50">Insight</div>
            </div>
            <div class="group relative cursor-pointer" onClick={() => setEditingDate(title)}>
              <div class="group-hover:visible invisible absolute -left-6 top-1">
                <PencilIcon class="w-4 h-4 opacity-50" />
              </div>
              {insight ? (
                <div class="border-l-2 border-blue-400 pl-2">{(insight as Insight).snippet}</div>
              ) : (
                <div class="opacity-50 italic">No insight yet</div>
              )}
            </div>
          </div>
        )
      })}

      <div class="pt-10 flex">
        <a
          href={location.pathname + '?d=' + format(sub(endDate, iteration(lookBack)), 'yyyy-MM-dd')}
        >
          <Button>Previous</Button>
        </a>
        <div class="flex-1" />
        {isBefore(endDate, startOfDay(today)) && (
          <a
            href={
              location.pathname + '?d=' + format(add(endDate, iteration(lookBack)), 'yyyy-MM-dd')
            }
          >
            <Button>Next</Button>
          </a>
        )}
      </div>
    </>
  )
}

const Today = () => {
  return
}
