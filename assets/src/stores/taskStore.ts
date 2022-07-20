import { action, atom, map } from 'nanostores'

import { API } from '@/api'
import { config } from '@/config'
import { Task } from '@/models'
import { projectStore } from '@/stores/projectStore'
import { assertIsDefined, logger } from '@/utils'

export type TaskMap = { [id: string]: Task }

class TaskStore {
  // --- stores

  taskList = atom<Task[]>([])

  taskMap = map<TaskMap>({})

  // --- actions

  updateTask = action(this.taskMap, 'updateTask', (store, task: Task) => {
    task = Task.fromJSON(task)
    store.setKey(task.id, task)
  })

  loadTask = async (id: string) => {
    if (this.taskMap.get()[id]) return

    const response = await API.getTask(id)
    this.updateTask(response.task)
  }

  createTask = async (attrs: Partial<Task>) => {
    const project = projectStore.currentProject.get()
    assertIsDefined(project, 'has project')

    const response = await API.createTask(project, attrs)
    logger.info('TASKS - create', response)
    this.updateTask(response.task)
    return response.task
  }

  saveTask = async (task: Task, attrs: Partial<Task>) => {
    const response = await API.updateTask(task.id, attrs)
    this.updateTask(response.task)
    return response.task
  }
}

export const taskStore = new TaskStore()
if (config.dev) (window as any)['taskStore'] = taskStore
