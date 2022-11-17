import { useEffect, useState } from 'preact/hooks'

import Helmet from '@/components/core/Helmet'
import AppHeader from '@/components/layout/AppHeader'
import LegacyTaskRow from '@/components/task/LegacyTaskRow'
import TaskRow from '@/components/task/TaskRow'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
  projectId?: string
}
export default (props: Props) => {
  const project = useStore(projectStore.projectMap)[
    props.projectId || projectStore.currentProject.get()?.id || ''
  ]
  const tasks = useStore(taskStore.taskList)

  useEffect(() => {
    if (project) {
      projectStore.setCurrentProject(project)
      taskStore.loadTasks(project)
    }
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

      <div class="max-w-7xl px-4 mt-4 sm:px-6 md:px-8">
        <div class="text-sm text-gray-400 font-semibold">SORT: oldest first</div>
      </div>

      <div class="max-w-7xl my-4 px-4 sm:px-6 md:px-8">
        <ul data-type="taskList">
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
