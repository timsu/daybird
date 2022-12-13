import { AxiosError } from 'axios'
import { format } from 'date-fns'
import { action, atom, map } from 'nanostores'
import { route } from 'preact-router'
import toast from 'react-hot-toast'

import { API } from '@/api'
import { EphemeralTopic } from '@/api/topicflowTopic'
import { config, paths } from '@/config'
import {
    File, fileListToTree, FileType, makeTreeFile, Project, sortFiles, TreeFile
} from '@/models'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { projectStore } from '@/stores/projectStore'
import { topicStore } from '@/stores/topicStore'
import { uiStore } from '@/stores/uiStore'
import { assertIsDefined, logger, unwrapError } from '@/utils'

export const DOC_EXT = '.seq'

const USER_DATA_EXPANDED = 'expanded'

type ProjectFileMap = { [projectId: string]: File[] }
type ProjectFileTree = { [projectId: string]: TreeFile[] }
type FileMap = { [id: string]: File }
type ExpansionMap = { [key: string]: boolean }

const KEY_TREECHANGE = 'treechange'
const KEY_RENAME = 'rename|'

class FileStore {
  // --- topics

  topics: { [id: string]: EphemeralTopic } = {}

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
    if (authStore.debugMode()) (window as any)['fileStore'] = fileStore

    try {
      const response = await API.listFiles(project)
      const files: File[] = response.files.map((f) => File.fromJSON(f, project.id))

      logger.debug('FILES - loaded files for project', project.name, sortFiles(files))
      this.updateFiles(project.id, files)

      if (!this.topics[project.id]) this.initTopic(project)
    } catch (e) {
      const status = (e as AxiosError).response?.status
      if (status == 401 || status == 404) {
        API.getUser()
          .then(() => {
            // user fetch success. this means the project is not accessible
            toast.error('Error loading files: ' + unwrapError(e))
          })
          .catch(() => {
            // user fetch failed. this mean token is expired.
            authStore.logout()
          })
      }
    }
  }

  newFile = async (projectId: string, name: string, type: FileType, parent?: string | null) => {
    name = name.trim()

    const response = await API.createFile(projectId, { name, type, parent })
    const file = File.fromJSON(response.file, projectId)

    const files = this.files.get()[projectId] || []
    const newFiles = sortFiles([...files, file])
    this.updateFiles(projectId, newFiles)
    this.topics[projectId]?.setSharedKey(KEY_TREECHANGE, Date.now())

    if (type == FileType.DOC) route(this.rootPath() + '/' + projectId + '/' + response.file.id)
  }

  dailyFileTitle = (date?: Date) => format(date || new Date(), 'yyyy-MM-dd')

  creatingFolders: null | Promise<TreeFile> = null
  newDailyFile = async (project: Project, date?: Date, provisionalFileId?: string) => {
    assertIsDefined(project, 'project is defined')
    const d = date || new Date()

    // critical section (don't let this run concurrently)
    if (this.creatingFolders) {
      await this.creatingFolders
    }
    this.creatingFolders = new Promise<TreeFile>(async (res) => {
      const projectFiles = this.getFilesFor(project)
      const files = this.files.get()[project.id] || []

      const yearName = format(d, 'yyyy')

      let yearFolder: TreeFile | undefined = projectFiles.find(
        (f) => f.file.type == FileType.FOLDER && f.file.name == yearName
      )
      if (!yearFolder) {
        const response = await API.createFile(project.id, { name: yearName, type: FileType.FOLDER })
        yearFolder = makeTreeFile(response.file)
        files.push(response.file)
        this.updateFiles(project.id, files)
      }

      const monthName = format(d, 'MM')
      let monthFolder: TreeFile | undefined = yearFolder.nodes!.find(
        (f) => f.file.type == FileType.FOLDER && f.file.name == monthName
      )
      if (!monthFolder) {
        const response = await API.createFile(project.id, {
          name: monthName,
          type: FileType.FOLDER,
          parent: yearFolder.file.id,
        })
        monthFolder = makeTreeFile(response.file)
        files.push(response.file)
        this.updateFiles(project.id, files)
      }

      res(monthFolder)
    })
    const monthFolder = await this.creatingFolders
    this.creatingFolders = null

    const name = this.dailyFileTitle(d)
    let file: TreeFile | undefined = monthFolder.nodes!.find((f) => f.file.name == name)

    if (file) return file.file

    if (provisionalFileId) {
      const newFile: File = File.newFile({
        id: provisionalFileId,
        name,
        type: FileType.DOC,
        parent: monthFolder.file.id,
        projectId: project.id,
      })

      logger.info('created provisional file', newFile)
      const files = this.files.get()[project.id] || []
      const newFiles = sortFiles([...files, newFile])
      this.updateFiles(project.id, newFiles)
      return newFile
    }

    return null
  }

  saveProvisionalFile = async (file: File) => {
    if (!file.provisional) return
    const projectId = file.projectId
    assertIsDefined(projectId)

    const response = await API.createFile(projectId, file)
    const newFile = File.fromJSON(response.file, projectId)

    const files = this.files.get()[projectId] || []
    const newFiles = sortFiles(files.filter((f) => f.id != file.id).concat([newFile]))
    this.updateFiles(projectId, newFiles)
    this.topics[projectId]?.setSharedKey(KEY_TREECHANGE, Date.now())
  }

  handleWikiLink = async (linkName: string) => {
    const currentDocId = docStore.doc.get()?.id
    if (!currentDocId) return
    const file = this.idToFile.get()[currentDocId]
    if (!file) return

    const files = this.files.get()[file.projectId!] || []
    const existing = files.find((f) => f.parent == file.parent && f.name == linkName)
    if (existing) {
      return this.openDoc(existing.id)
    }

    return this.newFile(file.projectId!, linkName, FileType.DOC, file.parent)
  }

  moveFile = async (projectId: string, file: File, newParent: string | null) => {
    if (newParent == file.id || newParent == file.parent) return

    // detect circular loops
    let allowed = true
    const fileMap = this.idToFile.get()
    let node: string | null | undefined = newParent
    while (node != null) {
      const parentFile: File | undefined = fileMap[node]
      if (parentFile.id == file.id) {
        allowed = false
        break
      }
      node = parentFile.parent
    }

    if (!allowed) return

    logger.info('set new file parent', file, newParent)
    file.parent = newParent
    const files = this.files.get()[projectId] || []
    this.updateFiles(projectId, files)

    try {
      await API.updateFile(file.projectId || projectId, file.id, { parent: newParent, projectId })
      this.topics[projectId]?.setSharedKey(KEY_TREECHANGE, Date.now())
    } catch (e) {
      toast.error(unwrapError(e))
    }

    // if project move
    if (file.projectId && projectId != file.projectId) {
      this.topics[file.projectId!]?.setSharedKey(KEY_TREECHANGE, Date.now())

      const newProject = projectId
      const oldProject = file.projectId

      const files = this.files.get()
      const newFiles = (files[newProject] || []).concat([file])
      this.updateFiles(newProject, newFiles)

      const oldFiles = (files[oldProject] || []).filter((f) => f.id != file.id)
      this.updateFiles(oldProject, oldFiles)

      if (location.pathname == `${this.rootPath()}/${oldProject}/${file.id}`) {
        location.pathname = `${this.rootPath()}/${newProject}/${file.id}`
      }
    }
  }

  renameFile = async (projectId: string, file: File, name: string) => {
    file.name = name
    this.files.notify()

    if (file.id == docStore.doc.get()?.id) {
      docStore.doc.set({
        ...docStore.doc.get()!,
        title: name,
      })
    }
    this.topics[projectId]?.setSharedKey(KEY_RENAME + file.id, name)

    try {
      await API.updateFile(projectId, file.id, { name })
    } catch (e) {
      toast.error(unwrapError(e))
    }
  }

  deleteFile = async (project: Project, file: File, archive?: boolean) => {
    if (!location.pathname.includes(this.rootPath()) && docStore.doc.get()?.id == file.id) {
      // special case for daily notes: just clear the document
      window.editor?.commands.clearContent(true)
      return
    }

    const files = this.files.get()[project.id]
    if (file.type == FileType.FOLDER) {
      const children = files.filter((f) => f.parent == file.id)
      children.forEach((child) => {
        API.updateFile(project.id, child.id, { parent: file.parent })
      })
    }

    const updates = archive
      ? { archived_at: new Date().toISOString() }
      : { deleted_at: new Date().toISOString() }
    await API.updateFile(project.id, file.id, updates)
    this.topics[project.id]?.setSharedKey(KEY_TREECHANGE, Date.now())

    const newFiles = files.filter((f) => f.id != file.id)
    this.updateFiles(project.id, newFiles)

    if (location.pathname.includes(encodeURI(file.id))) {
      route(uiStore.insightLoop ? paths.JOURNAL : paths.TODAY)
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

  initTopic = (project: Project) => {
    if (this.topics[project.id]) return
    const topicName = `files:${project.id}`
    const topic = topicStore.initEphemeralTopic(topicName)
    this.topics[project.id] = topic

    topic.onAllKeyChange((key, value) => {
      if (key == KEY_TREECHANGE) this.loadFiles(project)
      else if (key.startsWith(KEY_RENAME)) {
        const id = key.substring(KEY_RENAME.length)
        const file = this.idToFile.get()[id]
        if (file) {
          file.name = value
          this.fileTree.notify()
        }
        if (docStore.doc.get()?.id == id) {
          docStore.doc.set({
            ...docStore.doc.get()!,
            title: value,
          })
        }
      }
    })
  }

  isJournalFolder = (file: File): boolean => {
    if (!file) return false
    if (file.parent) {
      const parent = this.idToFile.get()[file.parent]
      return this.isJournalFolder(parent)
    }

    if (file.type != FileType.FOLDER) return false
    if (file.name.length != 4) return false
    const intValue = parseInt(file.name)
    return intValue > 2000 && intValue < 3000
  }

  openDoc = (id: string | undefined) => {
    const file = this.idToFile.get()[id || '']
    logger.info('open doc', id, file)
    if (!file) return

    if (isDailyFile(file.name)) {
      if (file.projectId != projectStore.currentProject.get()?.id) {
        projectStore.setCurrentProject(file.projectId!)
      }
      route(paths.TODAY + '?d=' + file.name)
    } else {
      route(this.rootPath() + '/' + file.projectId + '/' + file.id)
    }
  }

  rootPath = () => (uiStore.insightLoop ? paths.INSIGHT_DOC : paths.DOC)

  onOpenDoc = (id: string) => {
    const hasFiles = Object.keys(this.fileTree.get()).length > 0
    if (!hasFiles) {
      const unsub = this.fileTree.listen(() => {
        unsub()
        this.onOpenDoc(id)
      })
      return
    }

    const parents: string[] = []
    let projectId: string | undefined

    while (true) {
      const file = this.idToFile.get()[id]
      if (!projectId) projectId = file.projectId
      parents.push(id)
      if (!file || !file.parent) break
      id = file.parent
    }

    parents.forEach((p) => {
      const expansionKey = projectId + '/' + p
      this.expanded.get()[expansionKey] = true
    })
    this.expanded.notify()
  }
}

export const fileStore = new FileStore()
if (config.dev) (window as any)['fileStore'] = fileStore

export const isDailyFile = (name: string) => /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(name)
