import {
    add, differenceInDays, format, isAfter, isBefore, isSameWeek, isSameYear, parse, startOfDay, sub
} from 'date-fns'
import { useEffect, useState } from 'preact/hooks'
import { toast } from 'react-hot-toast'
import { v4 as uuid } from 'uuid'

import { API } from '@/api'
import Button from '@/components/core/Button'
import Loader from '@/components/core/Loader'
import Pressable from '@/components/core/Pressable'
import DailyNoteEditor from '@/components/editor/DailyNoteEditor'
import ReadOnlyEditor from '@/components/editor/ReadOnlyEditor'
import {
    DailyNote, dateToPeriodDateString, endOfDatePeriod, Period, periodFormatString, Project
} from '@/models'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { logger, toTitleCase, unwrapError } from '@/utils'
import { PencilIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

let startWithEditorOpen = true

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
    startWithEditorOpen && period == Period.DAY ? dateToPeriodDateString(period, today) : undefined
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
        const title = dateTitle(period, date, today)
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
              <div class="opacity-50">{period == Period.DAY ? format(date, 'P') : ''}</div>
            </div>

            {editingDate == dateString ? (
              <InsightEditor
                period={period}
                date={dateString}
                project={project}
                note={note}
                startDate={sub(date, iteration(1))}
                endDate={date}
                doneEditing={() => {
                  startWithEditorOpen = false
                  setEditingDate(undefined)
                }}
              />
            ) : (
              <div class="group relative cursor-pointer" onClick={() => setEditingDate(dateString)}>
                {period == Period.WEEK && !dateParam && !note && i == 1 && (
                  <div className="my-4 bg-yellow-100 rounded-md border-yellow-300 border p-4">
                    Write something for your past week:
                  </div>
                )}
                {!uiStore.reactNative && (
                  <div class="group-hover:visible invisible absolute -left-6 top-1">
                    <PencilIcon class="w-4 h-4 opacity-50" />
                  </div>
                )}
                {note?.snippet ? (
                  <div class="border-l-2 border-blue-400 pl-2 whitespace-pre-wrap break-words">
                    {note.snippet}
                  </div>
                ) : (
                  <div class="opacity-50 italic">
                    {period == Period.DAY ? 'No journal entry for this day' : 'No insight yet'}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div class="my-10 flex">
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

const uuidCache: { [date: string]: string } = {}

const dateTitle = (period: Period, date: Date, today: Date) =>
  period == Period.DAY
    ? Math.abs(differenceInDays(date, today)) < 6
      ? format(date, 'EEEE')
      : format(date, 'EEEE, MMMM do')
    : period == Period.MONTH
    ? isSameYear(date, today)
      ? format(date, 'MMMM')
      : format(date, 'MMMM yyyy')
    : period == Period.YEAR
    ? format(date, 'yyyy')
    : toTitleCase(period) + ' ending ' + format(date, 'P')

const InsightEditor = ({
  project,
  period,
  date,
  note,
  startDate,
  endDate,
  doneEditing,
}: {
  project: Project
  period: Period
  date: string
  note?: DailyNote
  startDate: Date
  endDate: Date
  doneEditing: () => void
}) => {
  if (period == Period.DAY) {
    if (!uuidCache[date]) uuidCache[date] = note?.id || uuid()
    return (
      <div>
        <DailyNoteEditor date={date} id={uuidCache[date]} project={project} type={period} />
        <Button onClick={doneEditing}>Done</Button>
      </div>
    )
  }

  const [aiContent, setAIContent] = useState<string>()
  const [showReviewNotes, setShowReviewNotes] = useState<boolean>(false)
  const [reviewNotes, setReviewNotes] = useState<DailyNote[]>([])
  const reviewPeriod =
    period == Period.WEEK ? Period.DAY : period == Period.MONTH ? Period.WEEK : Period.MONTH
  useEffect(() => {
    const start = dateToPeriodDateString(reviewPeriod, add(startDate, { days: 1 }))
    const end = dateToPeriodDateString(reviewPeriod, endDate)
    API.listNotes(project, reviewPeriod, start, end).then((r) =>
      setReviewNotes(r.notes.sort((a, b) => a.date.localeCompare(b.date)))
    )
  }, [period, date])

  return (
    <div>
      <div class="flex gap-2">
        {!aiContent && (
          <Button
            class="flex-1 px-0 justify-center"
            onClick={() => {
              setAIContent('Loading...')
              journalStore
                .generateAISummary(reviewNotes)
                .then(setAIContent)
                .catch((e) => {
                  toast.error(unwrapError(e))
                  setAIContent(undefined)
                })
            }}
          >
            AI Summary
          </Button>
        )}
        {!showReviewNotes && (
          <Button class="flex-1 px-0 justify-center" onClick={() => setShowReviewNotes(true)}>
            Show daily notes
          </Button>
        )}
      </div>

      {aiContent && (
        <div class="my-2 pl-2 border-l-2 border-l-gray-700">
          <div>Here's an automatic summary of your week:</div>
          <div class="my-2 italic">{aiContent}</div>
          <hr />
        </div>
      )}
      {reviewNotes.length > 0 && showReviewNotes && (
        <div class="my-2">
          {reviewNotes.map((note) => (
            <div class="my-2 border-l-2 border-blue-400 p-2 bg-gray-100 rounded-md">
              <div class="font-bold">
                {dateTitle(
                  reviewPeriod,
                  parse(note.date, periodFormatString(reviewPeriod), endDate),
                  new Date()
                )}
              </div>
              <ReadOnlyEditor project={project} id={note.id} />
            </div>
          ))}
        </div>
      )}
      <DailyNoteEditor date={date} id={note?.id || uuid()} project={project} type={period} />
      <Button onClick={doneEditing}>Done</Button>
    </div>
  )
}
