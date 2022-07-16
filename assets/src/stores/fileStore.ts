import { action, atom, map, onMount } from 'nanostores'

import { API } from '@/api'
import { config, File, FileType } from '@/config'
import { Project } from '@/models'
import { projectStore } from '@/stores/projectStore'
// import { projectStore } from '@/stores/projectStore'
import { logger } from '@/utils'

const DOC_EXT = '.delta'

class FileStore {
  // --- stores

  files = atom<File[]>([])

  currentFile = atom<File | undefined>()

  // --- actions

  updateFiles = action(this.files, 'listFiles', (store, files: File[]) => {
    store.set(files)
  })

  loadFiles = async (project: Project) => {
    logger.info('FILES - loading files for', project.name)
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
    this.updateFiles(files)
  }
}

export const fileStore = new FileStore()
if (config.dev) (window as any)['fileStore'] = fileStore

onMount(fileStore.files, () => {
  const unsub = projectStore.currentProject.subscribe((project) => {
    if (!project) return
    fileStore.loadFiles(project)
  })
  return unsub()
})
