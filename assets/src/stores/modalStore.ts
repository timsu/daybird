import { atom } from 'nanostores'

class ModalStore {
  // --- stores

  newProjectModal = atom<boolean>(false)
}

export const modalStore = new ModalStore()
