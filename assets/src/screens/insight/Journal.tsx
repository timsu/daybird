import { addDays, format, isBefore, parse, startOfDay, subDays } from 'date-fns'
import { useEffect, useState } from 'preact/hooks'
import { v4 as uuid } from 'uuid'

import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import Loader from '@/components/core/Loader'
import DailyNote from '@/components/editor/DailyNote'
import AppHeader from '@/components/layout/AppHeader'
import { Period } from '@/models'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import { logger } from '@/utils'
import { PencilIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

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

      <div class="flex flex-col grow w-full px-6 max-w-2xl">
        <JournalDays />
      </div>
    </>
  )
}

function JournalDays() {
  const project = useStore(projectStore.currentProject)
  const notes = useStore(journalStore.notes)
  const [dayCount, setDayCount] = useState(7)

  const params = new URLSearchParams(location.search)
  const dateParam = params.get('d')
  let endDate: Date = new Date()
  try {
    if (dateParam) endDate = parse(dateParam, 'yyyy-MM-dd', new Date())
  } catch (e) {
    logger.info(e)
  }

  const days = Array(dayCount).fill(0)
  const today = new Date()
  const [editingDate, setEditingDate] = useState(format(today, 'yyyy-MM-dd'))

  useEffect(() => {
    if (!project) return
    const start = format(subDays(endDate, dayCount), 'yyyy-MM-dd')
    const end = format(endDate, 'yyyy-MM-dd')
    journalStore.loadNotes(project, Period.DAY, start, end)
  }, [project?.id, dateParam])

  if (!project || !notes) return <Loader class="mx-auto" />

  return (
    <>
      {days.map((_, d) => {
        const date = subDays(endDate, d)
        const title = format(date, 'yyyy-MM-dd')
        const dayName = format(date, 'EEEE')
        const localeDate = format(date, 'P')
        const isToday = d == 0
        const note = notes[title]

        return (
          <div class="border-b p-4">
            <div class="flex justify-between">
              <div class="font-bold">
                {dayName}
                {isToday && ' (Today)'}
              </div>
              <div class="opacity-50">{localeDate}</div>
            </div>
            {editingDate == title ? (
              <DailyNote date={title} id={note?.id || uuid()} project={project} type={Period.DAY} />
            ) : (
              <div class="group relative cursor-pointer" onClick={() => setEditingDate(title)}>
                <div class="group-hover:visible invisible absolute -left-6 top-1">
                  <PencilIcon class="w-4 h-4 opacity-50" />
                </div>
                {note ? (
                  <div class="border-l-2 border-blue-400 pl-2">{note.snippet}</div>
                ) : (
                  <div class="opacity-50 italic">No journal entry for this day</div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div class="pt-10 flex">
        <a
          href={location.pathname + '?d=' + format(subDays(endDate || new Date(), 7), 'yyyy-MM-dd')}
        >
          <Button>Previous week</Button>
        </a>
        <div class="flex-1" />
        {isBefore(endDate, startOfDay(today)) && (
          <a
            href={
              location.pathname + '?d=' + format(addDays(endDate || new Date(), 7), 'yyyy-MM-dd')
            }
          >
            <Button>Next week</Button>
          </a>
        )}
      </div>
    </>
  )
}

const Today = () => {
  return
}
