import moment from 'moment'
import { action, atom, map, onMount } from 'nanostores'
import { route } from 'preact-router'

import { API } from '@/api'
import { config, File, FileType, paths } from '@/config'
import { Project } from '@/models'
import { projectStore } from '@/stores/projectStore'
// import { projectStore } from '@/stores/projectStore'
import { assertIsDefined, logger } from '@/utils'

const DOC_EXT = '.seq'

class FileStore {
  // --- stores

  files = atom<File[]>([])

  currentFile = atom<File | undefined>()

  // --- actions

  updateFiles = action(this.files, 'listFiles', (store, files: File[]) => {
    store.set(files)
  })

  loadFiles = async (project: Project) => {
    const response = await API.listFiles(project)
    const files: File[] = response.files.map((filename) => {
      const type: FileType = filename.endsWith(DOC_EXT) ? 'doc' : 'folder'
      return {
        name: type == 'doc' ? filename.slice(0, filename.length - DOC_EXT.length) : filename,
        path: filename,
        type,
        depth: 0,
      }
    })
    logger.info('FILES - loaded files for project', project.name, files)
    this.updateFiles(files)
  }

  newFile = async (name: string) => {
    const project = projectStore.currentProject.get()
    assertIsDefined(project, 'project is defined')

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
