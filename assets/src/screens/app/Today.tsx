import { addDays, format, isSameDay, parse, subDays } from 'date-fns'
import { useEffect, useState } from 'preact/hooks'

import Helmet from '@/components/core/Helmet'
import Tooltip from '@/components/core/Tooltip'
import Document from '@/components/editor/Document'
import DailyPrompt from '@/components/journal/DailyPrompt'
import DocMenu from '@/components/menus/DocMenu'
import { paths } from '@/config'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const project = useStore(projectStore.currentProject)
  const [todayDoc, setTodayDoc] = useState<string>('')

  const dateParam = new URLSearchParams(location.search).get('d')
  let date: Date = new Date()
  try {
    if (dateParam) date = parse(dateParam, 'yyyy-MM-dd', new Date())
  } catch (e) {
    logger.info(e)
  }

  useEffect(() => {
    uiStore.calendarDate.set(date)
  }, [date])

  const isToday = isSameDay(date, new Date())
  const title = isToday ? 'Today' : format(date, 'EEEE MMMM do')

  useEffect(() => {
    // todo wait until files are loaded
    if (!project) return

    if (!fileStore.fileTree.get()[project.id]) {
      const unsub = fileStore.fileTree.listen((value) => {
        if (!value[project.id]) return
        unsub()
        fileStore.newDailyFile(project, date).then(setTodayDoc)
      })
      return unsub
    } else {
      fileStore.newDailyFile(project, date).then(setTodayDoc)
    }
  }, [project?.id, date.getTime()])

  return (
    <div class="flex flex-col grow  w-full">
      <Helmet title={title} />

      <div className="max-w-2xl mx-auto w-full mt-4">
        <div class="flex items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

          <div class="flex-1" />

          <Tooltip message="Previous Day">
            <a
              className="p-2 hover:bg-gray-200 rounded-md"
              href={paths.TODAY + '?d=' + format(subDays(date || new Date(), 1), 'yyyy-MM-dd')}
            >
              <ChevronLeftIcon class="h-4 w-4 text-gray-400" />
            </a>
          </Tooltip>
          <Tooltip message="Next Day">
            <a
              className="p-2 hover:bg-gray-200 rounded-md"
              href={paths.TODAY + '?d=' + format(addDays(date || new Date(), 1), 'yyyy-MM-dd')}
            >
              <ChevronRightIcon class="h-4 w-4 text-gray-400" />
            </a>
          </Tooltip>
        </div>

        <DailyPrompt date={date} />
      </div>

      <DocMenu />
      {todayDoc && <Document projectId={project?.id} id={todayDoc} />}
    </div>
  )
}
