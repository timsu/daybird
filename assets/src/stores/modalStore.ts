import { atom } from 'nanostores'

import { config, File } from '@/config'
import { Project, Task } from '@/models'
import { uiStore } from '@/stores/uiStore'

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
if (config.dev) (window as any)['modalStore'] = modalStore

const hideSidebar = () => uiStore.sidebarOpen.set(false)

modalStore.newProjectModal.listen(hideSidebar)
modalStore.newFileModal.listen(hideSidebar)
modalStore.deleteFileModal.listen(hideSidebar)
modalStore.renameFileModal.listen(hideSidebar)
