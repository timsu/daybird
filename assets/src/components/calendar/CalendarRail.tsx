import { format, subDays } from 'date-fns'
import { route } from 'preact-router'
import { useEffect } from 'preact/hooks'

import DayView from '@/components/calendar/DayView'
import MonthView from '@/components/calendar/MonthView'
import { paths } from '@/config'
import { CALENDAR_OPEN_WIDTH, uiStore } from '@/stores/uiStore'
import { debounce, DebounceStyle } from '@/utils'
import { useStore } from '@nanostores/preact'

export default function () {
  const calendarOpen = useStore(uiStore.calendarOpen)
  const selectedDate = useStore(uiStore.calendarDate)
  const path = useStore(uiStore.path)

  useEffect(() => {
    if (location.pathname != paths.TODAY) return
    const onResize = () =>
      debounce(
        'cal-resize',
        () => {
          const shouldBeOpen = window.innerWidth > CALENDAR_OPEN_WIDTH
          const newSetting = uiStore.manualCalendarOpen ?? shouldBeOpen
          if (calendarOpen != newSetting) uiStore.calendarOpen.set(newSetting)
        },
        500,
        DebounceStyle.QUEUE_LAST
      )
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [calendarOpen, path])

  if (!calendarOpen) return null

  const onSelectDate = (d: Date) => {
    if (uiStore.insightLoop) route(paths.JOURNAL + '?d=' + format(d, 'yyyy-MM-dd'))
    else route(paths.TODAY + '?d=' + format(d, 'yyyy-MM-dd'))
  }

  return (
    <>
      <div className="w-52 xl:w-72 relative z-0">
        <div
          className="sm:hidden bg-gray-800/50 fixed left-0 top-0 w-full h-full z-20"
          onClick={() => uiStore.calendarOpen.set(false)}
        />
        <div className="w-52 xl:w-72 bg-white border-l fixed top-0 right-0 flex flex-col h-full pt-2 z-20">
          <MonthView currentDate={selectedDate} onSelect={onSelectDate} />
          <hr className="my-4" />
          <DayView date={selectedDate} />
        </div>
      </div>
    </>
  )
}
