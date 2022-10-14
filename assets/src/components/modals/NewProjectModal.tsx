import { useEffect, useState } from 'preact/hooks'

import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import Modal from '@/components/modals/Modal'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { makeInitials, unwrapError } from '@/utils'
import { Dialog } from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default () => {
  const [name, setName] = useState<string>()
  const [shortcode, setShortcode] = useState<string>()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const open = useStore(modalStore.newProjectModal)

  useEffect(() => {
    if (!open) return
    setName('')
    setShortcode('')
    setError('')
  }, [open])

  if (!open) return null

  const close = () => modalStore.newProjectModal.set(false)

  const onNameChange = (e: Event) => {
    const name = (e.target as HTMLInputElement).value
    setName(name)
    setShortcode(makeInitials(name))
  }

  const submit = async (e: Event) => {
    e.preventDefault()
    if (!name) return setError('Name must not be blank')
    if (!shortcode || shortcode.trim().length > 4) return setError('Code must be 1 - 4 characters')

    try {
      setSubmitting(true)
      await projectStore.createProject({ name: name.trim(), shortcode: shortcode.trim() })
      close()
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} close={close}>
      <form onSubmit={submit}>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <PlusIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            Create New Project
          </Dialog.Title>
          <div className="mt-6 text-left">
            <Input
              type="text"
              label="Project Name"
              id="name"
              placeholder="e.g. Home Projects, Marketing, Personal"
              value={name}
              autoComplete="off"
              onChange={onNameChange}
            />
            <Input
              type="text"
              label="Project Code (up to 4 letters)"
              id="shortcode"
              placeholder="Used to identify tasks for this project"
              value={shortcode}
              autoComplete="off"
              onChange={(e) => setShortcode((e.target as HTMLInputElement).value.toUpperCase())}
            />
          </div>
        </div>
        <div className="mt-5 sm:mt-6">
          <Submit label="Create" disabled={submitting} />
        </div>

        <ErrorMessage error={error} />
      </form>
    </Modal>
  )
}
