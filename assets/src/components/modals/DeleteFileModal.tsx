import DeleteModal from '@/components/modals/DeleteModal'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const deleteFileModal = useStore(modalStore.deleteFileModal)
  const open = !!deleteFileModal

  if (!open) return null

  const { project, file } = deleteFileModal

  const close = () => modalStore.deleteFileModal.set(false)

  const submit = async () => {
    await fileStore.deleteFile(project, file)
  }

  return <DeleteModal close={close} performAction={submit} label={file.name} />
}
