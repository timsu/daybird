import { Fragment } from 'preact'

import AppSidebar, { SidebarModals } from '@/components/nav/AppSidebar'
import { uiStore } from '@/stores/uiStore'
import { Dialog, Transition } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

export function SidebarMenu() {
  const sidebarOpen = useStore(uiStore.sidebarMenuOpen)

  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40 md:hidden touch-manipulation" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 flex z-40" onClick={() => uiStore.sidebarMenuOpen.set(false)}>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-100">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-1 -mr-12 pt-1">
                  <button
                    type="button"
                    className="flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => uiStore.sidebarMenuOpen.set(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              {sidebarOpen && (
                <>
                  <AppSidebar />
                  <SidebarModals />
                </>
              )}
            </Dialog.Panel>
          </Transition.Child>
          <div
            className="flex-shrink-0 w-14 touch-manipulation"
            aria-hidden="true"
            onClick={() => uiStore.sidebarMenuOpen.set(false)}
          >
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
