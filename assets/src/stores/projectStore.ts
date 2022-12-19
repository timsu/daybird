import { action, atom, map } from 'nanostores'
import { route } from 'preact-router'

import { API, ProjectResponse, ProjectWithMembersResponse } from '@/api'
import { config, paths } from '@/config'
import { FileType, Project, User } from '@/models'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { taskStore } from '@/stores/taskStore'
import { uiStore } from '@/stores/uiStore'
import { logger } from '@/utils'

export type ProjectMap = { [id: string]: Project }

class ProjectStore {
  // --- stores

  activeProjects = atom<Project[]>([])

  projects = atom<Project[]>([])

  projectMap = map<ProjectMap>({})

  currentProject = atom<Project | undefined>()

  // --- actions

  updateProjects = action(this.projects, 'updateProjects', (store, projects: Project[]) => {
    if (authStore.debugMode()) (window as any)['projectStore'] = projectStore

    logger.debug('PROJECTS - update', projects)
    store.set(projects)
    this.activeProjects.set(projects.filter((p) => !p.archived_at && !p.deleted_at))
    this.updateProjectMap(projects)
  })

  updateCurrentProject = action(
    this.currentProject,
    'updateCurrentProject',
    (store, user: User) => {
      const projects = this.projects.get()
      const lastProjectId = user.meta.lp
      let currentProject: Project | undefined
      if (!uiStore.insightLoop && lastProjectId) {
        currentProject = projects.find((p) => p.id == lastProjectId)
      }
      if (!currentProject) currentProject = projects[0]
      store.set(currentProject)
      if (currentProject) taskStore.loadTasks(currentProject)
    }
  )

  setCurrentProject = action(
    this.currentProject,
    'setCurrentProject',
    (store, projectOrId: Project | string) => {
      const projectId = typeof projectOrId == 'string' ? projectOrId : projectOrId.id

      if (store.get()?.id != projectId) {
        const project: Project | undefined = this.projects.get().find((p) => p.id == projectId)
        if (project) {
          store.set(project)
          const user = authStore.loggedInUser.get()
          if (user?.meta?.lp != project.id) {
            authStore.updateUser({ meta: { lp: project.id } })
          }
          taskStore.loadTasks(project)

          return project
        }
      }
    }
  )

  fetchProjectDetails = async (id: string) => {
    const project = this.projectMap.get()[id]
    if (project) this.currentProject.set(project)

    const response = await API.getProject(id)
    logger.info('loaded project details', response)
    response.project.members = response.members
    this.currentProject.set(response.project)
  }

  updateProjectMap = action(this.projectMap, 'updateProjectMap', (store, projects: Project[]) => {
    const projectMap: ProjectMap = {}
    projects.forEach((p) => (projectMap[p.id] = p))
    store.set(projectMap)

    if (!this.currentProject.get()) this.currentProject.set(projects[0])
  })

  createProject = action(this.projects, 'createProject', async (store, attrs: Partial<Project>) => {
    const response = await API.createProject(attrs)
    logger.info('PROJECTS - create', response)
    const project = Project.fromJSON(response.project)
    const projects = [...store.get(), project]
    this.updateProjects(projects)
    this.setCurrentProject(project)

    // create a document
    fileStore.newFile(project.id, 'Welcome', FileType.DOC)
    fileStore.setExpanded(project.id, true)
  })

  deleteProject = async (project: Project) => {
    this.updateProject(project, { deleted_at: new Date().toISOString() })

    const projects = this.projects.get().filter((p) => p.id != project.id)
    this.projects.set(projects)
    const newCurrentProject = projects[0]
    this.currentProject.set(newCurrentProject)
    route(paths.PROJECTS + '/' + newCurrentProject.id)
  }

  updateProject = async (project: Project, updates: Partial<Project>) => {
    const response = await API.updateProject(project, updates)
    this.onProjectUpdated(response)
  }

  onProjectUpdated = (response: ProjectResponse | ProjectWithMembersResponse) => {
    logger.info('on project updated', response)
    const project = Project.fromJSON(response.project)

    this.projects.set(this.projects.get().map((p) => (p.id == project.id ? project : p)))

    const currentProject = this.currentProject.get()
    if (currentProject?.id == project.id) {
      if (hasMembers(response)) project.members = response.members
      else project.members = currentProject.members
      this.currentProject.set(project)
    }
  }
}

function hasMembers(
  response: ProjectResponse | ProjectWithMembersResponse
): response is ProjectWithMembersResponse {
  return !!(response as ProjectWithMembersResponse).members
}

export const projectStore = new ProjectStore()

export const getProject = (projectId: string) => projectStore.projectMap.get()[projectId]
