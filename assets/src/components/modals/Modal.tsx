import { Fragment, RenderableProps } from 'preact'

import { Dialog, Transition } from '@headlessui/react'

type Props = {
  open: boolean
  close: () => void
  contentClass?: string
}

export default ({ children, ...rest }: RenderableProps<Props>) => {
  if (!rest.open) return null

  return (
    <ModalBase {...rest}>
      <Dialog.Panel
        className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left
                  overflow-hidden shadow-xl transform transition-all sm:my-8 max-w-sm w-full sm:p-6"
      >
        {children}
      </Dialog.Panel>
    </ModalBase>
  )
}

export const ModalWithoutPadding = ({ children, ...rest }: RenderableProps<Props>) => {
  if (!rest.open) return null

  return (
    <ModalBase {...rest}>
      <Dialog.Panel className="overflow-hidden rounded-lg bg-white shadow-md w-full max-w-lg">
        {children}
      </Dialog.Panel>
    </ModalBase>
  )
}

// modal without any content
export const ModalBase = ({ open, close, contentClass, children }: RenderableProps<Props>) => {
  return (
    <Transition.Root show={!!open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div
            className={
              contentClass || 'flex items-center justify-center min-h-full p-4 text-center sm:p-0'
            }
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              {children}
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
