import Button from '@/components/core/Button'
import Modal from '@/components/modals/Modal'
import { modalStore } from '@/stores/modalStore'
import { ctrlOrCommand } from '@/utils'
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
        <Shortcut hotkey="y" role="Jump to Today" />
        <Shortcut hotkey="\" role="Toggle focus mode" />
        <Shortcut hotkey="l" role="Add a link" />
        <Shortcut hotkey="j" role="Today page: Go to previous day" />
        <Shortcut hotkey="k" role="Today page: Go to next day" />
        <Shortcut hotkey="/" role="Show this help" />
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
