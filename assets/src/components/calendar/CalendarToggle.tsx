import Tooltip from '@/components/core/Tooltip'
import { uiStore } from '@/stores/uiStore'
import { classNames, debounce, DebounceStyle } from '@/utils'
import { CalendarIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default function () {
  const calendarOpen = useStore(uiStore.calendarOpen)

  const toggleCalendar = () => {
    const newSetting = !calendarOpen
    uiStore.calendarOpen.set(newSetting)
    uiStore.manualCalendarOpen = newSetting
  }

  return (
    <Tooltip message="Toggle Calendar" placement="left">
      <button
        type="button"
        onClick={toggleCalendar}
        className={classNames(
          'p-1 rounded-full',
          calendarOpen ? 'text-blue-400 hover:text-blue-500' : 'text-gray-400 hover:text-gray-500'
        )}
      >
        <span className="sr-only">Toggle Calendar</span>
        <CalendarIcon className="h-6 w-6" aria-hidden="true" />
      </button>
    </Tooltip>
  )
}
