import { action, atom, map } from 'nanostores'

import { API } from '@/api'
import { config } from '@/config'
import { Project, Task } from '@/models'
import { projectStore } from '@/stores/projectStore'
import { assertIsDefined, logger } from '@/utils'

export type TaskMap = { [id: string]: Task }

class TaskStore {
  // --- stores

  taskList = atom<Task[]>([])

  taskMap = map<TaskMap>({})

  deletedTask = atom<Task>()

  // --- actions

  updateTaskMap = action(this.taskMap, 'updateTaskMap', (store, task: Task) => {
    task = Task.fromJSON(task)
    store.setKey(task.id, task)
  })

  loadTasks = async (project: Project) => {
    this.taskList.set([])

    const response = await API.listTasks(project)
    const tasks = response.tasks.map((t) => Task.fromJSON(t))
    const taskMap = this.taskMap.get()
    tasks.forEach((t) => (taskMap[t.id] = t))
    this.taskMap.notify()
    this.taskList.set(tasks)
    return tasks
  }

  loadTask = async (id: string) => {
    if (this.taskMap.get()[id]) return

    const response = await API.getTask(id)
    this.updateTaskMap(response.task)
  }

  createTask = async (attrs: Partial<Task>) => {
    const project = projectStore.currentProject.get()
    assertIsDefined(project, 'has project')

    const response = await API.createTask(project, attrs)
    logger.info('TASKS - create', response)
    this.updateTaskMap(response.task)
    return response.task
  }

  saveTask = async (task: Task, attrs: Partial<Task>) => {
    this.updateTaskMap(Object.assign({}, task, attrs))

    const response = await API.updateTask(task.id, attrs)
    this.updateTaskMap(response.task)
    return response.task
  }

  toggleArchived = async (task: Task) => {
    this.saveTask(task, { archived_at: task.archived_at ? null : new Date().toISOString() })
  }

  deleteTask = async (task: Task) => {
    this.deletedTask.set(task)
    this.taskList.set(this.taskList.get().filter((t) => t.id != task.id))

    this.saveTask(task, { deleted_at: new Date().toISOString() })
  }
}

export const taskStore = new TaskStore()
if (config.dev) (window as any)['taskStore'] = taskStore
