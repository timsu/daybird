import { StateUpdater, useEffect, useState } from 'preact/hooks'

import {
    ContextMenuItem, ContextMenuWithData, triggerContextMenu
} from '@/components/core/ContextMenu'
import Helmet from '@/components/core/Helmet'
import Pressable from '@/components/core/Pressable'
import AppHeader from '@/components/layout/AppHeader'
import LegacyTaskRow from '@/components/task/LegacyTaskRow'
import TaskRow from '@/components/task/TaskRow'
import { Task } from '@/models'
import { docStore } from '@/stores/docStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { CheckIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
  projectId?: string
}

enum SortType {
  OLDEST,
  NEWEST,
  PRIORITY,
  DUE,
  ALPHA_A,
  ALPHA_Z,
}

const Labels = {
  [SortType.OLDEST]: 'oldest first',
  [SortType.NEWEST]: 'newest first',
  [SortType.PRIORITY]: 'by priority',
  [SortType.DUE]: 'by due date',
  [SortType.ALPHA_A]: 'by title (A-Z)',
  [SortType.ALPHA_Z]: 'by title (Z-A)',
}

const Sorts = {
  [SortType.OLDEST]: (a: Task, b: Task) => a.short_code.localeCompare(b.short_code),
  [SortType.NEWEST]: (a: Task, b: Task) => b.short_code.localeCompare(a.short_code),
  [SortType.PRIORITY]: (a: Task, b: Task) => (b.priority || 0) - (a.priority || 0),
  [SortType.DUE]: (a: Task, b: Task) => (a.due_at || '9').localeCompare(b.due_at || '9'),
  [SortType.ALPHA_A]: (a: Task, b: Task) => a.title.localeCompare(b.title),
  [SortType.ALPHA_Z]: (a: Task, b: Task) => b.title.localeCompare(a.title),
}

export default (props: Props) => {
  const project = useStore(projectStore.projectMap)[
    props.projectId || projectStore.currentProject.get()?.id || ''
  ]
  const allTasks = useStore(taskStore.taskLists)[project.id]

  const [tasks, setTasks] = useState<Task[]>([])
  const [sort, setSort] = useState<SortType>(SortType.OLDEST)

  useEffect(() => {
    if (sort == SortType.OLDEST) setTasks(allTasks)
    else if (sort == SortType.NEWEST) setTasks(allTasks.slice().reverse())
    else setTasks(allTasks.slice().sort(Sorts[sort]))
  }, [allTasks, sort])

  useEffect(() => {
    if (project) {
      projectStore.setCurrentProject(project)
      taskStore.loadTasks(project)
    }
    docStore.doc.set(undefined)
  }, [project?.id])

  if (!project) return null

  return (
    <>
      <Helmet title={`Tasks | ${project.name}`} />

      <AppHeader>
        <h1 className="text-2xl font-semibold text-gray-900">
          Tasks for {project.name} ({project.shortcode})
        </h1>
      </AppHeader>

      <div class="max-w-7xl px-4 my-8 sm:px-6 md:px-8">
        <LegacyTaskRow id={undefined} newTaskMode />
      </div>

      <hr />

      <SortMenu />

      <div class="max-w-7xl my-4 px-4 sm:px-6 md:px-8">
        <Pressable
          className="block w-40"
          onClick={(e) => triggerContextMenu(e.clientX, e.clientY, 'sort-menu', { sort, setSort })}
        >
          <div class="text-sm text-gray-400 font-semibold">SORT: {Labels[sort]}</div>
        </Pressable>

        <ul data-type="taskList" class="mb-20">
          {tasks.map((t) => (
            <li key={t.id} class="my-2">
              <TaskRow id={t.id} taskList />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

const SortMenu = () => (
  <ContextMenuWithData id="sort-menu">
    {({ sort, setSort }: { sort: SortType; setSort: StateUpdater<SortType> }) => (
      <>
        {Object.values(SortType)
          .filter((x) => typeof x == 'number')
          .map((type) => (
            <ContextMenuItem key={type} onClick={() => setSort(type as SortType)}>
              {Labels[type as SortType]}
              {sort == type ? <CheckIcon class="ml-2 h-4 w-4" /> : null}
            </ContextMenuItem>
          ))}
      </>
    )}
  </ContextMenuWithData>
)
