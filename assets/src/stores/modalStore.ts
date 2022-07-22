import { atom } from 'nanostores'

import { File } from '@/config'

class ModalStore {
  // --- stores

  newProjectModal = atom<boolean>(false)

  newFileModal = atom<'file' | 'folder' | false>(false)

  deleteFileModal = atom<File | false>(false)

  renameFileModal = atom<File | false>(false)
}

export const modalStore = new ModalStore()
