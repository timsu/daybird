import { format, subDays } from 'date-fns'
import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import Loader from '@/components/core/Loader'
import DailyNote from '@/components/editor/DailyNote'
import MiniEditor from '@/components/editor/MiniEditor'
import AppHeader from '@/components/layout/AppHeader'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
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

      <div class="flex flex-col grow w-full px-6 mt-4 max-w-2xl">
        <JournalDays />
      </div>
    </>
  )
}

function JournalDays() {
  const project = useStore(projectStore.currentProject)
  const notes = useStore(journalStore.notes)
  const [dayCount, setDayCount] = useState(7)

  const days = Array(dayCount).fill(0)
  const today = new Date()

  useEffect(() => {
    if (!project) return
    const start = format(subDays(today, dayCount), 'yyyy-MM-dd')
    const end = format(today, 'yyyy-MM-dd')
    journalStore.loadNotes(project, start, end)
  }, [project])

  if (!project || !notes) return <Loader class="mx-auto" />

  return (
    <>
      {days.map((_, d) => {
        const date = subDays(today, -d)
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
            {isToday ? (
              <DailyNote date={title} id={note?.id} project={project} />
            ) : note ? (
              <div class="border-l-2 border-blue-600 pl-2">{note.snippet}</div>
            ) : (
              <div class="opacity-50 italic">No journal entry for this day</div>
            )}
          </div>
        )
      })}

      <div class="pt-10">
        <Button onClick={() => {}}>Previous week</Button>
      </div>
    </>
  )
}

const Today = () => {
  return
}
