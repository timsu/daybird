import { format, subDays } from 'date-fns'
import { route } from 'preact-router'

import Calendar from '@/components/calendar/Calendar'
import { paths } from '@/config'
import { uiStore } from '@/stores/uiStore'
import { useStore } from '@nanostores/preact'

export default function () {
  const calendarOpen = useStore(uiStore.calendarOpen)
  const selectedDate = useStore(uiStore.calendarDate)

  if (!calendarOpen) return null

  const onSelectDate = (d: Date) => {
    route(paths.TODAY + '?d=' + format(d, 'yyyy-MM-dd'))
  }

  return (
    <div className="w-52 flex flex-col border-l print:hidden">
      <Calendar currentDate={selectedDate} onSelect={onSelectDate} />
    </div>
  )
}
