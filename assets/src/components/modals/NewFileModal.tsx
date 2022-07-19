import { Fragment } from 'preact'
import { useState } from 'preact/hooks'

import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import Modal from '@/components/modals/Modal'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { toTitleCase, unwrapError } from '@/utils'
import { Dialog, Transition } from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default () => {
  const [name, setName] = useState<string>()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const open = useStore(modalStore.newFileModal)

  if (!open) return null

  const noun = toTitleCase(open)

  const close = () => modalStore.newFileModal.set(false)

  const submit = async (e: Event) => {
    e.preventDefault()
    if (!name) return setError('Name must not be blank')

    if (name.match(/\//)) return setError('Invalid character in name: /')

    try {
      setSubmitting(true)
      await fileStore.newFile(name)
      setName('')
      setError('')
      close()
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={!!open} close={close}>
      <form onSubmit={submit}>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <PlusIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            New {noun}
          </Dialog.Title>
          <div className="mt-6 text-left">
            <Input
              type="text"
              label={`${noun} name`}
              id="name"
              value={name}
              autoComplete="off"
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
        <div className="mt-5 sm:mt-6">
          <Submit label={`Create ${noun}`} disabled={submitting} />
        </div>

        <ErrorMessage error={error} />
      </form>
    </Modal>
  )
}
