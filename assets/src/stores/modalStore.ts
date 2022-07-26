import { atom } from 'nanostores'

import { File } from '@/config'
import { Project, Task } from '@/models'

class ModalStore {
  // --- stores

  newProjectModal = atom<boolean>(false)

  newFileModal = atom<'file' | 'folder' | false>(false)

  deleteFileModal = atom<File | false>(false)

  renameFileModal = atom<File | false>(false)

  deleteTaskModal = atom<Task | false>(false)

  deleteProjectModal = atom<Project | false>(false)

  quickFindModal = atom<boolean>(false)
}

export const modalStore = new ModalStore()
