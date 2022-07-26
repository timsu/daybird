import DeleteModal from '@/components/modals/DeleteModal'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const project = useStore(modalStore.deleteProjectModal)
  const open = !!project

  if (!open) return null

  const close = () => modalStore.deleteProjectModal.set(false)

  const submit = async () => {
    projectStore.deleteProject(project)
  }

  return (
    <DeleteModal close={close} performAction={submit} label={project.name}>
      <div className="mt-3 text-center sm:mt-5">This will delete the project for everyone.</div>
    </DeleteModal>
  )
}
