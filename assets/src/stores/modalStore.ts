import { atom } from 'nanostores'

import { config } from '@/config'
import { File, FileType, Project, Task } from '@/models'
import { uiStore } from '@/stores/uiStore'

class ModalStore {
  // --- stores

  newProjectModal = atom<boolean>(false)

  newFileModal = atom<{ project: Project; type: FileType; parent?: string | null } | false>(false)

  deleteFileModal = atom<{ project: Project; file: File; archive?: boolean } | false>(false)

  renameFileModal = atom<{ project: Project; file: File } | false>(false)

  deleteTaskModal = atom<Task | false>(false)

  deleteProjectModal = atom<Project | false>(false)

  quickFindModal = atom<boolean>(false)

  onboardingModal = atom<boolean>(false)

  shortcutsModal = atom<boolean>(false)
}

export const modalStore = new ModalStore()
if (config.dev) (window as any)['modalStore'] = modalStore
