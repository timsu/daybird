import { atom } from 'nanostores'

class ModalStore {
  // --- stores

  newProjectModal = atom<boolean>(false)

  newFileModal = atom<'file' | 'folder' | false>(false)
}

export const modalStore = new ModalStore()
