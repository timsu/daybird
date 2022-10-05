import DeleteModal from '@/components/modals/DeleteModal'
import { FileType } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const deleteFileModal = useStore(modalStore.deleteFileModal)
  const open = !!deleteFileModal

  if (!open) return null

  const { project, file, archive } = deleteFileModal

  const close = () => modalStore.deleteFileModal.set(false)

  const submit = async () => {
    await fileStore.deleteFile(project, file, archive)
  }

  return (
    <DeleteModal archive={archive} close={close} performAction={submit} label={file.name}>
      {file.type == FileType.FOLDER && (
        <div className="text-center my-3">
          Any nested files and folders will be moved to the parent folder.
        </div>
      )}
    </DeleteModal>
  )
}
