import { action, atom, map } from 'nanostores'
import { Channel } from 'phoenix'
import Delta from 'quill-delta'

import { API } from '@/api'
import { config } from '@/config'
import { Project, User } from '@/models'
import { logger, unwrapError } from '@/utils'

export type ProjectMap = { [id: string]: Project }

class DocStore {
  // --- stores

  filename = atom<string | undefined>()

  document = atom<Delta | undefined>()

  version = atom<number>(0)

  docError = atom<string | undefined>()

  // --- actions

  docChannel?: Channel

  loadDoc = async (project: Project, filename: string) => {
    if (this.docChannel) this.docChannel.leave()

    this.filename.set(filename)
    this.docError.set(undefined)

    // this.docChannel = socketService.initChannel(`doc:${this.filename}`)
    // this.docChannel.join()

    try {
      const response = await API.readFile(project, filename)
      logger.info('DOCS - doc loaded', filename, response)

      this.document.set(response)
    } catch (e) {
      this.docError.set(unwrapError(e))
    }
  }

  saveDoc = async (project: Project, filename: string, contents: Delta) => {
    logger.info('DOCS - saving doc', filename, contents)
    try {
      await API.writeFile(project, filename, contents)
    } catch (e) {
      this.docError.set(unwrapError(e))
    }
  }
}

export const docStore = new DocStore()
if (config.dev) (window as any)['docStore'] = docStore
