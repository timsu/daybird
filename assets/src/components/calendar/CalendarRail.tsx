import { format, subDays } from 'date-fns'
import { route } from 'preact-router'
import { useEffect } from 'preact/hooks'

import Calendar from '@/components/calendar/Calendar'
import DayView from '@/components/calendar/DayView'
import { paths } from '@/config'
import { CALENDAR_OPEN_WIDTH, uiStore } from '@/stores/uiStore'
import { useStore } from '@nanostores/preact'

export default function () {
  const calendarOpen = useStore(uiStore.calendarOpen)
  const selectedDate = useStore(uiStore.calendarDate)
  const path = useStore(uiStore.path)

  useEffect(() => {
    if (location.pathname != paths.TODAY) return
    const onResize = () => {
      const shouldBeOpen = window.innerWidth > CALENDAR_OPEN_WIDTH
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
      <div className="w-52 relative">
        <div className="w-52 bg-white border-l fixed top-0 right-0 flex flex-col h-full pt-[49px]">
          <Calendar currentDate={selectedDate} onSelect={onSelectDate} />
          <hr className="my-4" />
          <DayView date={selectedDate} />
        </div>
      </div>
    </>
  )
}
