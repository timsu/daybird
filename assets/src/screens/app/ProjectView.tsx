import { useEffect, useState } from 'preact/hooks'

import DeleteButton from '@/components/core/DeleteButton'
import Helmet from '@/components/core/Helmet'
import DeleteProjectModal from '@/components/modals/DeleteProjectModal'
import TaskRow from '@/components/task/TaskRow'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { useStore } from '@nanostores/preact'

type Props = {
  id?: string
  path: string
}
export default ({ id }: Props) => {
  const project = useStore(projectStore.projectMap)[id || '']
  const tasks = useStore(taskStore.taskList)

  useEffect(() => {
    if (project) {
      projectStore.setCurrentProject(project)
      taskStore.loadTasks(project)
    }
  }, [project?.id])

  if (!project) return null

  return (
    <div className="py-6">
      <Helmet title={`Project | ${project.name}`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {project.name} ({project.shortcode})
        </h1>
      </div>

      <div className="h-8" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-gray-600 italic">Settings coming soon.</div>
      </div>

      <div className="h-8" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <DeleteButton onClick={() => modalStore.deleteProjectModal.set(project)}>
          Delete Project
        </DeleteButton>
      </div>

      <DeleteProjectModal />
    </div>
  )
}
