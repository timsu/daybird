import Calendar from '@/components/calendar/Calendar'
import { uiStore } from '@/stores/uiStore'
import { useStore } from '@nanostores/preact'

export default function () {
  const calendarOpen = useStore(uiStore.calendarOpen)
  if (!calendarOpen) return null

  return (
    <div className="w-52 flex flex-col border-l print:hidden">
      <Calendar />
    </div>
  )
}
