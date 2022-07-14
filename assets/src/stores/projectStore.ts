import { action, atom, map } from 'nanostores'

import { API } from '@/api'
import { config } from '@/config'
import { Project } from '@/models'
import { logger } from '@/utils'

export type ProjectMap = { [id: string]: Project }

class ProjectStore {
  // --- stores

  projects = atom<Project[]>([])

  projectMap = map<ProjectMap>({})

  currentProject = atom<Project | undefined>()

  // --- actions

  updateProjects = action(this.projects, 'updateProjects', (store, projects: Project[]) => {
    store.set(projects)
    this.updateProjectMap(projects)
  })

  updateProjectMap = action(this.projectMap, 'updateProjectMap', (store, projects: Project[]) => {
    const projectMap: ProjectMap = {}
    projects.forEach((p) => (projectMap[p.id] = p))
    store.set(projectMap)
  })

  createProject = action(this.projects, 'createProject', async (store, name: string) => {
    const response = await API.createProject(name)
    logger.info('PROJECTS - create', response)
    const projects = [...store.get(), response.project]
    this.updateProjects(projects)
  })
}

export const projectStore = new ProjectStore()
if (config.dev) (window as any)['projectStore'] = projectStore
