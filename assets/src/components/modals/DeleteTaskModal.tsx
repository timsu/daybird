import { Fragment } from 'preact'
import { useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import Modal from '@/components/modals/Modal'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { toTitleCase, unwrapError } from '@/utils'
import { Dialog, Transition } from '@headlessui/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default () => {
  const [error, setError] = useState<string>()
  const task = useStore(modalStore.deleteTaskModal)
  const open = !!task

  if (!open) return null

  const close = () => modalStore.deleteTaskModal.set(false)

  const submit = async (e: Event) => {
    e.preventDefault()

    try {
      await taskStore.deleteTask(task)
      close()
    } catch (e) {
      setError(unwrapError(e))
    }
  }

  return (
    <Modal open={!!open} close={close}>
      <form onSubmit={submit}>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            Delete {task.title}?
          </Dialog.Title>
        </div>
        <div className="mt-5 sm:mt-6 flex justify-between">
          <Button class="bg-gray-500" onClick={close}>
            Cancel
          </Button>
          <Button class="bg-red-500 hover:bg-red-800" onClick={submit}>
            Confirm Delete
          </Button>
        </div>

        <ErrorMessage error={error} />
      </form>
    </Modal>
  )
}
