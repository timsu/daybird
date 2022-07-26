import moment from 'moment-mini'
import { action, atom, map, onMount } from 'nanostores'
import { route } from 'preact-router'

import { API } from '@/api'
import { config, File, FileType, paths } from '@/config'
import { Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { projectStore } from '@/stores/projectStore'
// import { projectStore } from '@/stores/projectStore'
import { assertIsDefined, logger } from '@/utils'

export const DOC_EXT = '.seq'

class FileStore {
  // --- stores

  files = atom<File[]>([])

  // --- actions

  updateFiles = action(this.files, 'listFiles', (store, files: File[]) => {
    store.set(files)
  })

  loadFiles = async (project: Project) => {
    const response = await API.listFiles(project)
    const files: File[] = response.files
      .map((filename) => {
        const type: FileType = filename.endsWith(DOC_EXT) ? 'doc' : 'folder'
        return {
          name: type == 'doc' ? filename.slice(0, filename.length - DOC_EXT.length) : filename,
          path: filename,
          type,
          depth: 0,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    logger.info('FILES - loaded files for project', project.name, files)
    this.updateFiles(files)
  }

  newFile = async (name: string) => {
    const project = projectStore.currentProject.get()
    assertIsDefined(project, 'project is defined')

    name = name.trim()
    const path = name.endsWith(DOC_EXT) ? name : name + DOC_EXT
    await API.writeFile(project, path, '')
    logger.info('FILES - new file', name)
    const file: File = { name, path, type: 'doc', depth: 0 }
    this.files.set([...this.files.get(), file])

    route(paths.DOC + '/' + project.id + '/' + path)
  }

  newDailyFile = async () => {
    const name = moment().format('YYYY-MM-DD')
    const existing = this.files.get().find((f) => f.name == name)

    const project = projectStore.currentProject.get()
    assertIsDefined(project, 'project is defined')
    if (existing) route(paths.DOC + '/' + project.id + '/' + existing.path)
    else await this.newFile(name)
  }

  renameFile = async (file: File, name: string) => {
    const project = projectStore.currentProject.get()
    assertIsDefined(project, 'project is defined')

    const prevPath = file.path
    const rootPath = prevPath.substring(0, prevPath.lastIndexOf('/') + 1)
    const newPath = rootPath + name + (file.type == 'doc' ? DOC_EXT : '')

    file.path = newPath
    file.name = name
    this.files.notify()

    await API.renameFile(project, prevPath, newPath)
    if (docStore.filename.get() == prevPath) {
      route(`${paths.DOC}/${project.id}/${newPath}`)
    }
  }

  deleteFile = async (file: File) => {
    const project = projectStore.currentProject.get()
    assertIsDefined(project, 'project is defined')

    await API.deleteFile(project, file.path)

    const removeFile = (files: File[]) => {
      if (!files) return files

      if (files.find((f) => f.path == file.path)) {
        return files.filter((f) => f.path != file.path)
      } else {
        files.forEach((f) => {
          if (f.children) f.children = removeFile(f.children)
        })
        return files
      }
    }
    this.files.set(removeFile(this.files.get()))
    this.files.notify()

    if (location.pathname.includes(encodeURI(file.path))) {
      route(paths.APP)
    }
  }
}

export const fileStore = new FileStore()
if (config.dev) (window as any)['fileStore'] = fileStore

onMount(fileStore.files, () => {
  const unsub = projectStore.currentProject.subscribe((project) => {
    if (!project) return
    fileStore.loadFiles(project)
  })
  return () => unsub()
})

export const getNameFromPath = (path: string) =>
  path.substring(path.lastIndexOf('/') + 1).replace(DOC_EXT, '')
