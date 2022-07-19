import { action, atom, map } from 'nanostores'
import { route } from 'preact-router'

import { API } from '@/api'
import { config, paths } from '@/config'
import { Project, User } from '@/models'
import { authStore } from '@/stores/authStore'
import { logger } from '@/utils'

export type ProjectMap = { [id: string]: Project }

class ProjectStore {
  // --- stores

  projects = atom<Project[]>([])

  projectMap = map<ProjectMap>({})

  currentProject = atom<Project | undefined>()

  // --- actions

  updateProjects = action(this.projects, 'updateProjects', (store, projects: Project[]) => {
    logger.info('PROJECTS - update', projects)
    store.set(projects)
    this.updateProjectMap(projects)
  })

  updateCurrentProject = action(
    this.currentProject,
    'updateCurrentProject',
    (store, user: User) => {
      const projects = this.projects.get()
      const lastProjectId = user.meta.lp
      let currentProject: Project | undefined = projects[0]
      if (lastProjectId) {
        currentProject = projects.find((p) => p.id == lastProjectId)
      }
      store.set(currentProject)
    }
  )

  setCurrentProject = action(
    this.currentProject,
    'setCurrentProject',
    (store, project: Project) => {
      if (store.get()?.id != project.id) {
        store.set(project)
        authStore.updateUser({ meta: { lp: project.id } })
      }
    }
  )

  updateProjectMap = action(this.projectMap, 'updateProjectMap', (store, projects: Project[]) => {
    const projectMap: ProjectMap = {}
    projects.forEach((p) => (projectMap[p.id] = p))
    store.set(projectMap)
  })

  createProject = action(this.projects, 'createProject', async (store, name: string) => {
    const response = await API.createProject(name)
    logger.info('PROJECTS - create', response)
    const project = Project.fromJSON(response.project)
    const projects = [...store.get(), project]
    this.updateProjects(projects)

    route(paths.PROJECTS + '/' + project.id)
  })
}

export const projectStore = new ProjectStore()
if (config.dev) (window as any)['projectStore'] = projectStore
