import { action, atom } from 'nanostores'

import { API } from '@/api'
import { config } from '@/config'
import { Project } from '@/models'

class ProjectStore {
  // --- stores

  projects = atom<Project[] | undefined>()

  currentProject = atom<Project | undefined>()

  // --- actions

  updateProjects = action(this.projects, 'updateProjects', (store, projects: Project[]) => {
    store.set(projects)
  })
}

export const projectStore = new ProjectStore()
if (config.dev) (window as any)['projectStore'] = projectStore
