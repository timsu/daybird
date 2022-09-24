import moment from 'moment-mini'
import { action, map } from 'nanostores'
import { route } from 'preact-router'

import { API } from '@/api'
import { config, paths } from '@/config'
import { File, FileType, Project } from '@/models'
import { assertIsDefined, logger } from '@/utils'

export const DOC_EXT = '.seq'

const USER_DATA_EXPANDED = 'expanded'

type ProjectFileMap = { [projectId: string]: File[] }
type FileMap = { [id: string]: File }
type ExpansionMap = { [key: string]: boolean }

class FileStore {
  // --- stores

  files = map<ProjectFileMap>({})

  idToFile = map<FileMap>({})

  expanded = map<ExpansionMap>({})

  // --- actions

  getFilesFor = (project: Project) => {
    return this.files.get()[project.id] || []
  }

  updateFiles = action(this.files, 'listFiles', (store, projectId: string, files: File[]) => {
    store.setKey(projectId, files)

    const fileMap = this.idToFile.get()
    files.forEach((f) => (fileMap[f.id] = f))
    this.idToFile.notify()
  })

  loadFiles = async (project: Project) => {
    const response = await API.listFiles(project)
    const files: File[] = response.files.map(File.fromJSON)

    logger.info('FILES - loaded files for project', project.name, sortFiles(files))
    this.updateFiles(project.id, files)
  }

  newFile = async (project: Project, name: string, type: FileType, parent?: string) => {
    name = name.trim()

    const response = await API.createFile(project, { name, type, parent })
    const files = this.files.get()[project.id] || []
    const newFiles = sortFiles([...files, response.file])
    this.updateFiles(project.id, newFiles)

    if (type == FileType.DOC) route(paths.DOC + '/' + project.id + '/' + response.file.id)
  }

  dailyFileTitle = () => moment().format('YYYY-MM-DD')

  newDailyFile = async (project: Project) => {
    const name = this.dailyFileTitle()
    const existing = this.getFilesFor(project).find((f) => f.name == name)

    assertIsDefined(project, 'project is defined')
    if (existing) route(paths.DOC + '/' + project.id + '/' + existing.id)
    else await this.newFile(project, name, FileType.DOC)
  }

  renameFile = async (project: Project, file: File, name: string) => {
    file.name = name
    this.files.notify()

    await API.updateFile(project, file.id, { name })
  }

  deleteFile = async (project: Project, file: File) => {
    await API.updateFile(project, file.id, { deleted_at: new Date().toISOString() })

    const files = this.getFilesFor(project)
    this.updateFiles(
      project.id,
      files.filter((f) => f.id != file.id)
    )
    this.files.notify()

    if (location.pathname.includes(encodeURI(file.id))) {
      route(paths.APP)
    }
  }

  loadExpanded = async () => {
    const response = await API.getUserData(USER_DATA_EXPANDED)
    if (response) this.expanded.set(response)
  }

  setExpanded = (key: string, setting: boolean) => {
    if (this.expanded.get()[key] == setting) return
    this.expanded.setKey(key, setting)

    const expanded = this.expanded.get()
    const data = Object.keys(expanded)
      .filter((ex) => expanded[ex])
      .reduce((r, v) => {
        r[v] = true
        return r
      }, {} as ExpansionMap)
    API.setUserData(USER_DATA_EXPANDED, data)
  }
}

export const fileStore = new FileStore()
if (config.dev) (window as any)['fileStore'] = fileStore

const sortFiles = (files: File[]) =>
  files.sort((a, b) => (a.type == b.type ? a.name.localeCompare(b.name) : b.type - a.type))
