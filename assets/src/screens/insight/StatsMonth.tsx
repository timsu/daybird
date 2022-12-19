import { endOfMonth, format, startOfMonth, sub } from 'date-fns'

import { API } from '@/api'
import CalendarWidget, { CalendarProps } from '@/components/core/CalendarWidget'
import { dateToPeriodDateString, Period } from '@/models'
import { projectStore } from '@/stores/projectStore'
import { useStore } from '@nanostores/preact'

type JournalDays = { [d: string]: boolean }

// from https://medium.com/@jain.jenil007/building-a-calendar-in-react-2c53b6ca3e96
export default (props: CalendarProps) => {
  const project = useStore(projectStore.currentProject)

  const specialDaysFn = async (activeDate: Date) => {
    if (!project) return

    const period = Period.DAY
    const start = dateToPeriodDateString(period, startOfMonth(activeDate))
    const end = dateToPeriodDateString(period, endOfMonth(activeDate))
    const response = await API.listNotes(project, period, start, end)

    const days: JournalDays = {}
    response.notes.forEach((note) => {
      const [_y, _m, d] = note.date.split('-')
      if (d) days[d.replace(/^0/, '')] = true
    })
    return { days: days, class: 'text-blue-500 font-semibold' }
  }

  return <CalendarWidget {...props} specialDaysFn={specialDaysFn} />
}
