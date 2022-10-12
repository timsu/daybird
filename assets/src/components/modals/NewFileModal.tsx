import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'preact/hooks'

import ErrorMessage from '@/components/core/ErrorMessage'
import Input from '@/components/core/Input'
import Pressable from '@/components/core/Pressable'
import Submit from '@/components/core/Submit'
import Modal from '@/components/modals/Modal'
import { FileType } from '@/models'
import { fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { unwrapError } from '@/utils'
import { Dialog } from '@headlessui/react'
import { DocumentIcon, FolderIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export default () => {
  const [name, setName] = useState<string>()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const newFileOpen = useStore(modalStore.newFileModal)
  const renameFileOpen = useStore(modalStore.renameFileModal)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = newFileOpen || renameFileOpen

  const isRename = !!renameFileOpen
  const project = newFileOpen ? newFileOpen.project : renameFileOpen ? renameFileOpen.project : null
  const type = newFileOpen
    ? newFileOpen.type
    : renameFileOpen
    ? renameFileOpen.file.type
    : FileType.DOC
  const noun = type == FileType.FOLDER ? 'Folder' : 'Note'

  useEffect(() => {
    setName(renameFileOpen ? renameFileOpen.file.name : '')
    setError('')
  }, [newFileOpen, renameFileOpen])

  if (!open) return null

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
        await fileStore.renameFile(renameFileOpen.project.id, renameFileOpen.file, name)
      } else if (newFileOpen) {
        await fileStore.newFile(newFileOpen.project.id, name, newFileOpen.type, newFileOpen.parent)
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
          {noun == 'Note' ? <DocumentIcon class={iconClass} /> : <FolderIcon class={iconClass} />}
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            {isRename ? 'Rename' : 'New'} {noun}
            {!isRename && project && ` (${project.name})`}
          </Dialog.Title>
          <div className="mt-6 text-left">
            <Input
              forwardRef={inputRef}
              type="text"
              label={`${noun} name`}
              id="name"
              value={name}
              autoComplete="off"
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
            />
          </div>
          <Pressable
            onClick={(e) => {
              setName(format(new Date(), 'yy.MM.dd ') + name)
              inputRef.current?.focus()
            }}
          >
            <div className="text-blue-500 text-sm">Insert today's date (YY.MM.DD)</div>
          </Pressable>
        </div>
        <div className="mt-5 sm:mt-6">
          <Submit label={`${isRename ? 'Rename' : 'Create'} ${noun}`} disabled={submitting} />
        </div>

        <ErrorMessage error={error} />
      </form>
    </Modal>
  )
}
