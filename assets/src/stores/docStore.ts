import { action, atom, map } from 'nanostores'
import { Channel } from 'phoenix'

import { API } from '@/api'
import { config } from '@/config'
import { Project, User } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { logger, unwrapError } from '@/utils'

export type ProjectMap = { [id: string]: Project }

class DocStore {
  // --- stores

  id = atom<string | undefined>()

  title = atom<string | undefined>()

  document = atom<any | undefined>()

  version = atom<number>(0)

  docError = atom<string | undefined>()

  fileListener?: () => void | undefined

  // --- actions

  docChannel?: Channel

  loadDoc = async (project: Project, id: string) => {
    if (this.docChannel) this.docChannel.leave()

    this.id.set(id)
    this.title.set(undefined)
    this.document.set(undefined)
    this.docError.set(undefined)

    this.fileListener?.()
    this.fileListener = fileStore.idToFile.subscribe((fileMap) => {
      const file = fileMap[id]
      if (file) this.title.set(file.name)
    })

    try {
      this.document.set(undefined)
      const response = await API.readFile(project, id)
      logger.info('DOCS - doc loaded', id, response)

      this.document.set(response)
    } catch (e) {
      this.docError.set(unwrapError(e))
    }
  }

  saveDoc = async (project: Project, id: string, contents: any) => {
    logger.info('DOCS - saving doc', id, contents)
    try {
      await API.writeFile(project, id, contents)
    } catch (e) {
      this.docError.set(unwrapError(e))
    }
  }
}

export const docStore = new DocStore()
if (config.dev) (window as any)['docStore'] = docStore
