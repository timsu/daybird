import DeleteModal from '@/components/modals/DeleteModal'
import { modalStore } from '@/stores/modalStore'
import { taskStore } from '@/stores/taskStore'
import { useStore } from '@nanostores/preact'

export default () => {
  const task = useStore(modalStore.deleteTaskModal)
  const open = !!task

  if (!open) return null

  const close = () => modalStore.deleteTaskModal.set(false)

  const submit = async () => {
    await taskStore.deleteTask(task)
  }

  return <DeleteModal close={close} performAction={submit} label={task.title} />
}
