import { RenderableProps } from 'preact'
import { useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import ErrorMessage from '@/components/core/ErrorMessage'
import Modal from '@/components/modals/Modal'
import { unwrapError } from '@/utils'
import { Dialog } from '@headlessui/react'
import { ArchiveIcon, TrashIcon } from '@heroicons/react/outline'

type Props = {
  label: string
  archive?: boolean
  close: () => void
  performAction: () => Promise<void>
}

export default ({ archive, label, close, children, performAction }: RenderableProps<Props>) => {
  const [error, setError] = useState<string>()
  const verb = archive ? 'Archive' : 'Delete'

  const submit = async (e: Event) => {
    e.preventDefault()

    try {
      await performAction()
      close()
    } catch (e) {
      setError(unwrapError(e))
    }
  }

  const onDeletePress = (e: KeyboardEvent) => {
    if (e.key == 'Escape') close()
    else submit(e)
  }

  return (
    <Modal open={!!open} close={close}>
      <form onSubmit={submit}>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          {archive ? (
            <ArchiveIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
          ) : (
            <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          )}
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            {verb} “{label}”?
          </Dialog.Title>
        </div>

        {children}

        <div className="mt-5 sm:mt-6 flex justify-between">
          <Button class="bg-gray-500" onClick={close} onKeyPress={close} tabIndex={0}>
            Cancel
          </Button>
          <Button
            class="bg-red-500 hover:bg-red-800"
            onClick={submit}
            onKeyPress={onDeletePress}
            tabIndex={1}
          >
            Confirm {verb}
          </Button>
        </div>

        <ErrorMessage error={error} />
      </form>
    </Modal>
  )
}
