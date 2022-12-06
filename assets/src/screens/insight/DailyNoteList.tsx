import { add, format, isAfter, isBefore, isSameWeek, parse, startOfDay, sub } from 'date-fns'
import { useEffect, useState } from 'preact/hooks'
import { v4 as uuid } from 'uuid'

import Button from '@/components/core/Button'
import Loader from '@/components/core/Loader'
import DailyNoteEditor from '@/components/editor/DailyNoteEditor'
import { DailyNote, dateToPeriodDateString, endOfDatePeriod, Period, Project } from '@/models'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import { logger, toTitleCase } from '@/utils'
import { PencilIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default function ({ period }: { period: Period }) {
  const project = useStore(projectStore.currentProject)
  const notes = useStore(journalStore.notes)

  const lookBack = period == Period.DAY ? 7 : 6

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
  const [editingDate, setEditingDate] = useState(
    period == Period.DAY ? dateToPeriodDateString(period, today) : undefined
  )

  const iteration = (n: number) =>
    period == Period.DAY
      ? { days: n }
      : period == Period.WEEK
      ? { weeks: n }
      : period == Period.MONTH
      ? { months: n }
      : { years: n }

  useEffect(() => {
    if (!project) return
    const start = dateToPeriodDateString(period, sub(endDate, iteration(lookBack)))
    const end = dateToPeriodDateString(period, endDate)
    journalStore.loadNotes(project, period, start, end)
  }, [project, dateParam, period])

  if (!project || !notes) return <Loader class="mx-auto" />

  return (
    <>
      {entries.map((_, i) => {
        const partialDate = sub(endDate, iteration(i))
        const date = endOfDatePeriod(period, partialDate)
        const title =
          period == Period.DAY
            ? isSameWeek(date, today)
              ? format(date, 'EEEE')
              : format(date, 'EEEE, MMMM do')
            : toTitleCase(period) + ' ending ' + format(date, 'P')
        const isThisPeriod = isBefore(today, date) && isAfter(today, sub(date, iteration(1)))
        const dateString = dateToPeriodDateString(period, date)
        const note: DailyNote | undefined = notes[dateString]

        return (
          <div class="border-b p-4">
            <div class="flex justify-between">
              <div class="font-bold">
                {title}
                {isThisPeriod && ` (${period == Period.DAY ? 'today' : `this ${period}`})`}
              </div>
              <div class="opacity-50">{period == Period.DAY ? format(date, 'P') : 'Insight'}</div>
            </div>

            {editingDate == dateString ? (
              <InsightEditor period={period} date={dateString} project={project} note={note} />
            ) : (
              <div class="group relative cursor-pointer" onClick={() => setEditingDate(dateString)}>
                <div class="group-hover:visible invisible absolute -left-6 top-1">
                  <PencilIcon class="w-4 h-4 opacity-50" />
                </div>
                {note ? (
                  <div class="border-l-2 border-blue-400 pl-2">{note.snippet}</div>
                ) : (
                  <div class="opacity-50 italic">No insight yet</div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div class="pt-10 flex">
        <a
          href={location.pathname + '?d=' + format(sub(endDate, iteration(lookBack)), 'yyyy-MM-dd')}
        >
          <Button>Previous{period == Period.DAY && ' week'}</Button>
        </a>
        <div class="flex-1" />
        {isBefore(endDate, startOfDay(today)) && (
          <a
            href={
              location.pathname + '?d=' + format(add(endDate, iteration(lookBack)), 'yyyy-MM-dd')
            }
          >
            <Button>Next{period == Period.DAY && ' week'}</Button>
          </a>
        )}
      </div>
    </>
  )
}

const InsightEditor = ({
  project,
  period,
  date,
  note,
}: {
  project: Project
  period: Period
  date: string
  note?: DailyNote
}) => {
  return <DailyNoteEditor date={date} id={note?.id || uuid()} project={project} type={period} />
}
