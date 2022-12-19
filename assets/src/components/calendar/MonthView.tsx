import { format } from 'date-fns'
import { useCallback } from 'preact/hooks'

import CalendarWidget from '@/components/core/CalendarWidget'
import { FileType } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { useStore } from '@nanostores/preact'

type Props = {
  currentDate?: Date
  onSelect?: (date: Date) => void
}

type JournalDays = { [d: string]: boolean }

// from https://medium.com/@jain.jenil007/building-a-calendar-in-react-2c53b6ca3e96
export default (props: Props) => {
  const currentProject = useStore(projectStore.currentProject)
  const fileTree = useStore(fileStore.fileTree)

  const specialDaysFn = async (activeDate: Date) => {
    if (!currentProject) return
    const files = fileTree[currentProject.id]
    if (!files) return
    const [year, month] = format(activeDate, 'yyyy-MM').split('-')

    const yearFolder = files.find((f) => f.file.type == FileType.FOLDER && f.file.name == year)
    if (!yearFolder) return { days: {}, class: '' }

    const monthFolder = yearFolder.nodes!.find(
      (f) => f.file.type == FileType.FOLDER && f.file.name == month
    )
    if (!monthFolder) return { days: {}, class: '' }

    const days: JournalDays = {}
    monthFolder.nodes!.forEach((f) => {
      if (f.file.provisional) return
      const [_y, _m, d] = f.label.split('-')
      if (d) days[d.replace(/^0/, '')] = true
    })
    return { days: days, class: 'text-orange-500 font-semibold' }
  }

  return <CalendarWidget {...props} specialDaysFn={specialDaysFn} />
}
