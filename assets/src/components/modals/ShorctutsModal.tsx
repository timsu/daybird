import { StateUpdater, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Modal, { ModalWithoutPadding } from '@/components/modals/Modal'
import create_task from '@/images/create_task.mp4'
import install_daybird from '@/images/install_daybird.mp4'
import new_notes from '@/images/new_notes.mp4'
import { authStore } from '@/stores/authStore'
import { modalStore } from '@/stores/modalStore'
import { ctrlOrCommand } from '@/utils'
import { Dialog } from '@headlessui/react'
import { useStore } from '@nanostores/preact'

enum Page {
  INTRO = 0,
  NOTES,
  MORE,
}

export default () => {
  const open = useStore(modalStore.shortcutsModal)

  if (!open) return null

  const close = () => {
    modalStore.shortcutsModal.set(false)
  }

  return (
    <Modal open={!!open} close={() => {}}>
      <div class="font-bold text-xl">Keyboard Shortcuts</div>

      <div class="text-gray-700 text-left">
        <Shortcut hotkey="p" role="Quickly switch notes and projects" />
        <Shortcut hotkey="\" role="Toggle focus mode" />
        <Shortcut hotkey="l" role="Add a link" />
        <Shortcut hotkey="j" role="Today page: Go to previous day" />
        <Shortcut hotkey="k" role="Today page: Go to next day" />
        <Shortcut hotkey="?" role="Show this help" />
      </div>

      <div class="mt-8 flex justify-center">
        <Button onClick={close}>Close</Button>
      </div>
    </Modal>
  )
}

const Shortcut = ({ hotkey, role }: { hotkey: string; role: string }) => (
  <div class="flex my-4">
    <div class="font-mono">
      {ctrlOrCommand()}+{hotkey}
    </div>
    <div class="flex-1" />
    <div>{role}</div>
  </div>
)
