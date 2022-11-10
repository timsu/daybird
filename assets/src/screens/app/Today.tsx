import { addDays, endOfDay, format, isAfter, isSameDay, parse, startOfDay, subDays } from 'date-fns'
import { route } from 'preact-router'
import { useEffect, useRef, useState } from 'preact/hooks'
import { v4 as uuid } from 'uuid'

import { EphemeralTopic } from '@/api/topicflowTopic'
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
import useShortcut, { checkShortcut } from '@/hooks/useShortcut'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { topicStore } from '@/stores/topicStore'
import { CALENDAR_OPEN_WIDTH, uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'
import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const params = new URLSearchParams(location.search)
  const project = useStore(projectStore.currentProject)

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

  useShortcut(
    (e) => {
      if (checkShortcut(e, 'j', 'k')) {
        const newDate = addDays(date || new Date(), e.key == 'j' ? -1 : 1)
        const newUrl = paths.TODAY + '?d=' + format(newDate, 'yyyy-MM-dd')
        route(newUrl)
        return true
      }
      return false
    },
    [date]
  )

  return (
    <>
      <Helmet title={title} />

      <AppHeader>
        <div class="flex flex-1 gap-2 items-center relative overflow-hidden">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
            {title}
          </h1>

          <Pressable
            onClick={(e) => {
              const pos = (e.target as HTMLDivElement).getBoundingClientRect()
              triggerContextMenu(pos.left, pos.top, 'doc-menu', {
                dailyNote: true,
                docId: docStore.id.get(),
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
      <div class="flex flex-col grow w-full px-6 mt-4 max-w-2xl mx-auto">
        <DailyPrompt date={date} />
        <TodayDoc date={date} />
      </div>
    </>
  )
}

const TodayDoc = ({ date }: { date: Date }) => {
  const project = useStore(projectStore.currentProject)
  const topicflowReady = useStore(topicStore.ready)
  const topicSub = useRef<EphemeralTopic>()
  const [todayDocId, setTodayDocId] = useState<string>('')
  const dateString = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    setTodayDocId('')
  }, [project?.id, date])

  // subscribe to topicflow - if we receive a document id, use that
  useEffect(() => {
    if (!project || !topicflowReady) return

    let topic = topicSub.current
    if (topic && !topic.topic.id.endsWith(project.id)) {
      topic.unsubscribe()
      topic = undefined
    }
    if (!topic) {
      topic = topicSub.current = topicStore.initEphemeralTopic('today:' + project.id)
    }
    const unsub = topic.onKeyChange(dateString, (_, value) => {
      if (value) setTodayDocId(value)
    })
    return unsub
  }, [project?.id, date, topicflowReady])

  // subscribe to files, check for existing document
  useEffect(() => {
    if (!project) return
    const onDailyFile = (id: string | null) =>
      setTodayDocId((prevValue) => {
        if (id) return id
        if (prevValue) return prevValue
        const newValue = uuid()
        topicSub.current?.setSharedKey(dateString, newValue)
        return newValue
      })

    if (!fileStore.fileTree.get()[project.id]) {
      // if files were not loaded, wait until files are loaded
      const unsub = fileStore.fileTree.listen((value) => {
        if (!value[project.id]) return
        unsub()
        fileStore.newDailyFile(project, date).then(onDailyFile)
      })
      return unsub
    } else {
      fileStore.newDailyFile(project, date).then(onDailyFile)
    }
  }, [project?.id, date])

  // create provisional file if needed
  useEffect(() => {
    if (!project || !todayDocId) return

    if (!fileStore.idToFile.get()[todayDocId]) {
      fileStore.newDailyFile(project, date, todayDocId)
      uiStore.checkForOnboarding()
    }
  }, [todayDocId])

  if (!todayDocId) return null

  return <Document projectId={project?.id} id={todayDocId} />
}
