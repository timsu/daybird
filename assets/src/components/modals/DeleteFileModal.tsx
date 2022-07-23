import DeleteModal from '@/components/modals/DeleteModal'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const file = useStore(modalStore.deleteFileModal)
  const open = !!file

  if (!open) return null

  const close = () => modalStore.deleteFileModal.set(false)

  const submit = async () => {
    await fileStore.deleteFile(file)
  }

  return <DeleteModal close={close} performAction={submit} label={file.name} />
}
