import moment from 'moment-mini'
import { action, map } from 'nanostores'
import { route } from 'preact-router'

import { API } from '@/api'
import { config, paths } from '@/config'
import {
    File, fileListToTree, FileType, makeTreeFile, Project, sortFiles, TreeFile
} from '@/models'
import { docStore } from '@/stores/docStore'
import { assertIsDefined, logger, unwrapError } from '@/utils'

export const DOC_EXT = '.seq'

const USER_DATA_EXPANDED = 'expanded'

type ProjectFileMap = { [projectId: string]: File[] }
type ProjectFileTree = { [projectId: string]: TreeFile[] }
type FileMap = { [id: string]: File }
type ExpansionMap = { [key: string]: boolean }

class FileStore {
  // --- stores

  files = map<ProjectFileMap>({})

  fileTree = map<ProjectFileTree>({})

  idToFile = map<FileMap>({})

  expanded = map<ExpansionMap>({})

  // --- actions

  getFilesFor = (project: Project) => {
    return this.fileTree.get()[project.id] || []
  }

  updateFiles = action(this.files, 'listFiles', (store, projectId: string, files: File[]) => {
    store.setKey(projectId, files)

    const fileMap = this.idToFile.get()
    files.forEach((f) => (fileMap[f.id] = f))
    this.idToFile.notify()

    const tree = fileListToTree(files)
    this.fileTree.setKey(projectId, tree)
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
    assertIsDefined(project, 'project is defined')

    const projectFiles = this.getFilesFor(project)
    const files = this.files.get()[project.id] || []

    const yearName = moment().format('YYYY')
    let yearFolder: TreeFile | undefined = projectFiles.find(
      (f) => f.file.type == FileType.FOLDER && f.file.name == yearName
    )
    if (!yearFolder) {
      const response = await API.createFile(project, { name: yearName, type: FileType.FOLDER })
      yearFolder = makeTreeFile(response.file)
      files.push(response.file)
    }

    const monthName = moment().format('MM')
    let monthFolder: TreeFile | undefined = yearFolder.nodes!.find(
      (f) => f.file.type == FileType.FOLDER && f.file.name == monthName
    )
    if (!monthFolder) {
      const response = await API.createFile(project, {
        name: monthName,
        type: FileType.FOLDER,
        parent: yearFolder.file.id,
      })
      monthFolder = makeTreeFile(response.file)
      files.push(response.file)
    }

    const name = this.dailyFileTitle()
    let file: TreeFile | undefined = monthFolder.nodes!.find((f) => f.file.name == name)
    if (file) {
      route(paths.DOC + '/' + project.id + '/' + file.file.id)
      return
    }

    const response = await API.createFile(project, {
      name,
      type: FileType.DOC,
      parent: monthFolder.file.id,
    })
    const newFiles = sortFiles([...files, response.file])
    this.updateFiles(project.id, newFiles)

    route(paths.DOC + '/' + project.id + '/' + response.file.id)
  }

  moveFile = async (projectId: string, file: File, newParent: string | null) => {
    if (newParent == file.parent) return
    logger.info('set new file parent', file, newParent)
    file.parent = newParent
    const files = this.files.get()[projectId] || []
    this.updateFiles(projectId, files)

    try {
      await API.updateFile(projectId, file.id, { parent: newParent })
    } catch (e) {
      docStore.docError.set(unwrapError(e))
    }
  }

  renameFile = async (projectId: string, file: File, name: string) => {
    file.name = name
    this.files.notify()

    try {
      await API.updateFile(projectId, file.id, { name })
    } catch (e) {
      docStore.docError.set(unwrapError(e))
    }
  }

  deleteFile = async (project: Project, file: File) => {
    const files = this.files.get()[project.id]
    if (file.type == FileType.FOLDER) {
      const children = files.filter((f) => f.parent == file.id)
      children.forEach((child) => {
        API.updateFile(project.id, child.id, { parent: file.parent })
      })
    }

    await API.updateFile(project.id, file.id, { deleted_at: new Date().toISOString() })

    const newFiles = files.filter((f) => f.id != file.id)
    this.updateFiles(project.id, newFiles)

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
