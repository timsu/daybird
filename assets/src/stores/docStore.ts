import { decode } from 'base64-arraybuffer'
import { atom } from 'nanostores'
import toast from 'react-hot-toast'

import { API } from '@/api'
import { NODE_NAME } from '@/components/editor/LegacyTaskItem'
import { config } from '@/config'
import { Project } from '@/models'
import { authStore } from '@/stores/authStore'
import { fileStore } from '@/stores/fileStore'
import { taskStore } from '@/stores/taskStore'
import { logger, unwrapError } from '@/utils'

export type ProjectMap = { [id: string]: Project }

export const LS_LAST_DOC = 'ld'

type Doc = {
  id: string
  title?: string
  contents?: string
}

class DocStore {
  // --- stores

  doc = atom<Doc | undefined>()

  dirty = atom<boolean>(false)

  docCache: { [id: string]: any } = {}

  showMenu = atom<boolean>(false)

  fileListener?: () => void | undefined

  // --- actions

  initEmptyDoc = (title: string) => {
    this.doc.set({
      id: '',
      title,
      contents: '',
    })
  }

  loadDoc = async (project: Project, id: string, skipLoadTitle = false) => {
    if (authStore.debugMode()) (window as any)['docStore'] = docStore

    const cached = this.docCache[id]
    const file = fileStore.idToFile.get()[id]

    this.doc.set({
      id,
      title: file?.name,
      contents: cached,
    })

    this.fileListener?.()
    if (!file && !skipLoadTitle) {
      this.fileListener = fileStore.idToFile.subscribe((fileMap) => {
        const file = fileMap[id]
        const doc = this.doc.get()
        if (!doc || !file) return
        this.doc.set({
          ...doc,
          title: file.name,
        })
      })
    } else {
      this.fileListener = undefined
    }

    try {
      const response = (await API.readFile(project, id)) as string
      logger.info('DOCS - doc loaded', id, response.length)

      const doc = this.doc.get()!
      if (id != doc.id) return
      if (response != doc.contents) {
        this.doc.set({ ...doc, contents: response })
        this.docCache[id] = response
      }
      localStorage.setItem(LS_LAST_DOC, project.id + '/' + id)
    } catch (e) {
      toast.error(unwrapError(e))
      localStorage.removeItem(LS_LAST_DOC)
    }
  }

  saveDoc = async (project: Project, id: string, contents: any) => {
    logger.info('DOCS - saving doc', id, typeof contents)
    try {
      await API.writeFile(project, id, contents)
      if (this.docCache[id]) this.docCache[id] = contents
    } catch (e) {
      toast.error(unwrapError(e))
    }
  }

  removeCompletedTasks = () => {
    const doc = window.editor?.state.doc
    if (!doc) return
    const tasks = taskStore.taskMap.get()

    // add items to delete
    const positionsToDelete: { from: number; to: number }[] = []
    doc.descendants((node, pos) => {
      if (node.type.name == 'task' || node.type.name == 'taskItem') {
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
