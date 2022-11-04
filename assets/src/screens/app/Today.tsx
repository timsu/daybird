import { addDays, endOfDay, format, isAfter, isSameDay, parse, startOfDay, subDays } from 'date-fns'
import { useEffect, useState } from 'preact/hooks'
import uniqolor from 'uniqolor'

import { triggerContextMenu } from '@/components/core/ContextMenu'
import Helmet from '@/components/core/Helmet'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import Document from '@/components/editor/Document'
import Actions from '@/components/journal/Actions'
import DailyPrompt from '@/components/journal/DailyPrompt'
import AppHeader from '@/components/layout/AppHeader'
import DocMenu from '@/components/menus/DocMenu'
import { paths } from '@/config'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { CALENDAR_OPEN_WIDTH, uiStore } from '@/stores/uiStore'
import { lightColorFor, logger } from '@/utils'
import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const params = new URLSearchParams(location.search)

  const project = useStore(projectStore.currentProject)
  const [todayDoc, setTodayDoc] = useState<string>('')

  const projectParam = params.get('p')
  useEffect(() => {
    if (projectParam && projectParam != project?.id) projectStore.setCurrentProject(projectParam)
  }, [projectParam, project])

  const dateParam = params.get('d')
  let date: Date = new Date()
  try {
    if (dateParam) date = parse(dateParam, 'yyyy-MM-dd', new Date())
  } catch (e) {
    logger.info(e)
  }

  // on first navigate, open calendar
  useEffect(() => uiStore.calendarOpen.set(window.innerWidth > CALENDAR_OPEN_WIDTH), [])

  useEffect(() => {
    uiStore.calendarDate.set(date)
    setTimeout(() => window.editor?.commands.focus(), 50)
  }, [date])

  const today = startOfDay(new Date())
  const isToday = isSameDay(date, today)
  const showActions = isAfter(date, today)
  const title = isToday
    ? 'Today'
    : format(date, document.body.clientWidth > 500 ? 'EEEE MMMM do' : 'EEE M/d')

  const [_, updateTitle] = useState(0)
  useEffect(() => {
    // update title once it crosses midnight
    if (isToday)
      setTimeout(() => updateTitle(Date.now()), endOfDay(date).getTime() - Date.now() + 1000)
  }, [isToday, date])

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
    <>
      <Helmet title={title} />

      <AppHeader>
        <div class="flex flex-1 gap-2 items-center sm:pl-4 relative overflow-hidden">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
            {title}
          </h1>

          <Pressable
            onClick={(e) => {
              const pos = (e.target as HTMLDivElement).getBoundingClientRect()
              triggerContextMenu(pos.left, pos.top, 'doc-menu', {
                dailyNote: true,
                docId: todayDoc,
                projectId: project?.id,
              })
            }}
          >
            <DotsHorizontalIcon className="h-4 w-4 text-gray-400" />
          </Pressable>

          {showActions && <Actions />}

          <div class="flex-1" />

          <Tooltip message="Previous Day" placement="right">
            <a
              className="p-2 hover:bg-gray-200/50 rounded-md"
              href={paths.TODAY + '?d=' + format(subDays(date || new Date(), 1), 'yyyy-MM-dd')}
            >
              <ChevronLeftIcon class="h-4 w-4 text-gray-400" />
            </a>
          </Tooltip>
          <Tooltip message="Next Day" placement="right">
            <a
              className="p-2 hover:bg-gray-200/50 rounded-md"
              href={paths.TODAY + '?d=' + format(addDays(date || new Date(), 1), 'yyyy-MM-dd')}
            >
              <ChevronRightIcon class="h-4 w-4 text-gray-400" />
            </a>
          </Tooltip>
        </div>
      </AppHeader>
      <DocMenu />
      <div class="flex flex-col grow w-full px-6 mt-4">
        <DailyPrompt date={date} />
        {todayDoc && <Document projectId={project?.id} id={todayDoc} />}
      </div>
    </>
  )
}
