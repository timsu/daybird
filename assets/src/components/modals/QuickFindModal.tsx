import { useEffect, useState } from 'preact/hooks'

import Input from '@/components/core/Input'
import Modal from '@/components/modals/Modal'
import { modalStore } from '@/stores/modalStore'
import { isMac } from '@/utils/os'
import { useStore } from '@nanostores/preact'

export default () => {
  const [name, setName] = useState<string>()
  const open = useStore(modalStore.quickFindModal)

  useEffect(() => {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const modifier = isMac ? e.metaKey : e.ctrlKey
      if (modifier && e.key == 'p') {
        modalStore.quickFindModal.set(true)
        e.preventDefault()
      }
    })
  }, [])

  if (!open) return null

  return (
    <Modal open={!!open} close={close}>
      <Input
        type="text"
        label={`Jump to a file`}
        id="name"
        value={name}
        autoComplete="off"
        onChange={(e) => setName((e.target as HTMLInputElement).value)}
      />
    </Modal>
  )
}
