import { Fragment } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Submit from '@/components/core/Submit'
import Modal from '@/components/modals/Modal'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { toTitleCase, unwrapError } from '@/utils'
import { Dialog, Transition } from '@headlessui/react'
import { DocumentIcon, PlusIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default () => {
  const [name, setName] = useState<string>()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const newFileOpen = useStore(modalStore.newFileModal)
  const renameFileOpen = useStore(modalStore.renameFileModal)

  const open = newFileOpen || renameFileOpen

  if (!open) return null

  const isRename = !!renameFileOpen
  const noun = toTitleCase(newFileOpen ? newFileOpen : renameFileOpen ? renameFileOpen.type : '')

  useEffect(() => {
    setName(renameFileOpen ? renameFileOpen.name : '')
    setError('')
  }, [newFileOpen, renameFileOpen])

  const close = () => {
    modalStore.newFileModal.set(false)
    modalStore.renameFileModal.set(false)
  }

  const submit = async (e: Event) => {
    e.preventDefault()
    if (!name) return setError('Name must not be blank')

    if (name.match(/\//)) return setError('Invalid character in name: /')

    try {
      setSubmitting(true)

      if (renameFileOpen) {
        await fileStore.renameFile(renameFileOpen, name)
      } else {
        await fileStore.newFile(name)
      }
      close()
    } catch (e) {
      setError(unwrapError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const [iconBg, iconColor] = isRename
    ? ['bg-blue-100', 'text-blue-600']
    : ['bg-green-100', 'text-green-600']
  const iconClass = `h-6 w-6 ${iconColor}`

  return (
    <Modal open={!!open} close={close}>
      <form onSubmit={submit}>
        <div
          className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBg}`}
        >
          {isRename ? <DocumentIcon class={iconClass} /> : <PlusIcon class={iconClass} />}
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            {isRename ? 'Rename' : 'New'} {noun}
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
          <Submit label={`${isRename ? 'Rename' : 'Create'} ${noun}`} disabled={submitting} />
        </div>

        <ErrorMessage error={error} />
      </form>
    </Modal>
  )
}
