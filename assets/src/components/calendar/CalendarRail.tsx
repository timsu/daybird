import { format, subDays } from 'date-fns'
import { route } from 'preact-router'
import { useEffect } from 'preact/hooks'

import Calendar from '@/components/calendar/Calendar'
import DayView from '@/components/calendar/DayView'
import { paths } from '@/config'
import { uiStore } from '@/stores/uiStore'
import { useStore } from '@nanostores/preact'

export default function () {
  const calendarOpen = useStore(uiStore.calendarOpen)
  const selectedDate = useStore(uiStore.calendarDate)
  const path = useStore(uiStore.path)

  useEffect(() => {
    if (location.pathname != paths.TODAY) return
    const onResize = () => {
      const shouldBeOpen = window.innerWidth > 700
      if (calendarOpen != shouldBeOpen) uiStore.calendarOpen.set(shouldBeOpen)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calendarOpen, path])

  if (!calendarOpen) return null

  const onSelectDate = (d: Date) => {
    route(paths.TODAY + '?d=' + format(d, 'yyyy-MM-dd'))
  }

  return (
    <>
      <div className="w-52 flex-col border-l flex relative">
        <div className="w-52 fixed right-0">
          <Calendar currentDate={selectedDate} onSelect={onSelectDate} />
          <hr className="my-4" />
          <DayView date={selectedDate} />
        </div>
      </div>
    </>
  )
}
