import { decode } from 'base64-arraybuffer'
import { atom } from 'nanostores'

import { API } from '@/api'
import { NODE_NAME } from '@/components/editor/TaskItem'
import { config } from '@/config'
import { Project } from '@/models'
import { authStore } from '@/stores/authStore'
import { fileStore } from '@/stores/fileStore'
import { taskStore } from '@/stores/taskStore'
import { logger, unwrapError } from '@/utils'

export type ProjectMap = { [id: string]: Project }

export const LS_LAST_DOC = 'ld'

class DocStore {
  // --- stores

  id = atom<string | undefined>()

  title = atom<string | undefined>()

  document = atom<any | undefined>()

  version = atom<number>(0)

  docError = atom<string | undefined>()

  dirty = atom<boolean>(false)

  docCache: { [id: string]: any } = {}

  fileListener?: () => void | undefined

  // --- actions

  loadDoc = async (project: Project, id: string) => {
    if (authStore.debugMode()) (window as any)['docStore'] = docStore

    const cached = this.docCache[id]
    const file = fileStore.idToFile.get()[id]

    this.id.set(id)
    this.title.set(file?.name)
    this.document.set(cached)
    this.docError.set(undefined)

    this.fileListener?.()
    this.fileListener = fileStore.idToFile.subscribe((fileMap) => {
      const file = fileMap[id]
      if (file) setTimeout(() => this.title.set(file.name), 0)
    })

    try {
      const response = (await API.readFile(project, id)) as string
      logger.info('DOCS - doc loaded', id, response.length)
      if (id != this.id.get()) return
      this.document.set(response)
      this.docCache[id] = response
      localStorage.setItem(LS_LAST_DOC, project.id + '/' + id)
    } catch (e) {
      this.docError.set(unwrapError(e))
      localStorage.removeItem(LS_LAST_DOC)
    }
  }

  saveDoc = async (project: Project, id: string, contents: any) => {
    logger.info('DOCS - saving doc', id, typeof contents)
    try {
      await API.writeFile(project, id, contents)
      if (this.docCache[id]) this.docCache[id].contents = contents
    } catch (e) {
      this.docError.set(unwrapError(e))
    }
  }

  removeCompletedTasks = () => {
    const doc = window.editor?.state.doc
    if (!doc) return
    const tasks = taskStore.taskMap.get()

    // add items to delete
    const positionsToDelete: { from: number; to: number }[] = []
    doc.descendants((node, pos) => {
      if (node.type.name == NODE_NAME) {
        const id = node.attrs.id
        if (!id) return
        const task = tasks[id]
        if (task?.completed_at) {
          positionsToDelete.push({
            from: pos,
            to: pos + node.nodeSize,
          })
        }
      }
    })

    // sort in descending order (so deleting doesn't change other positions)
    positionsToDelete.reverse()
    window.editor!.commands.forEach(positionsToDelete, (item, { commands }) => {
      return commands.deleteRange(item)
    })
  }
}

export const docStore = new DocStore()
