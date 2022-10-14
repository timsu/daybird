import { Fragment, RenderableProps } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import CalendarRail from '@/components/calendar/CalendarRail'
import TaskContextMenu from '@/components/menus/TaskContextMenu'
import DeleteTaskModal from '@/components/modals/DeleteTaskModal'
import QuickFindModal from '@/components/modals/QuickFindModal'
import AppSidebar from '@/components/nav/AppSidebar'
import useSwipe from '@/hooks/useSwipe'
import { uiStore } from '@/stores/uiStore'
import { classNames, ctrlOrCommand } from '@/utils'
import { Dialog, Transition } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

import { Header } from './Header'

export default function ({ children }: RenderableProps<{}>) {
  const sidebarOpen = useStore(uiStore.sidebarOpen)
  const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(false)

  const setSidebarOpen = (state: boolean) => uiStore.sidebarOpen.set(state)

  useEffect(() => {
    if (sidebarOpen) {
      const unsub = uiStore.path.listen(() => {
        setSidebarOpen(false)
      })
      return unsub
    }
  }, [sidebarOpen])

  useSwipe((dir) => {
    setSidebarOpen(dir == 'right')
  })

  const props = { sidebarOpen, desktopSidebarHidden, setSidebarOpen, setDesktopSidebarHidden }

  return (
    <>
      <SidebarMenu {...props} />
      {!desktopSidebarHidden && (
        <div className="hidden md:flex md:w-52 md:flex-col md:fixed md:inset-y-0 relative">
          <AppSidebar darkHeader />
        </div>
      )}

      <div
        className={classNames(
          !desktopSidebarHidden ? 'md:ml-52' : '',
          'flex flex-col min-h-full print:h-auto bg-white'
        )}
      >
        <Header {...props} />

        <div className="flex-1 flex">
          <main className="flex flex-1 flex-col mt-1 px-6">{children}</main>
          <CalendarRail />
        </div>

        <TaskContextMenu />
        <DeleteTaskModal />
        <QuickFindModal />
      </div>
    </>
  )
}

export type SidebarProps = {
  sidebarOpen: boolean
  desktopSidebarHidden: boolean
  setDesktopSidebarHidden: (s: boolean) => void
  setSidebarOpen: (s: boolean) => void
}

function SidebarMenu(p: SidebarProps) {
  const { sidebarOpen, setSidebarOpen } = p
  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onTouchStart={() => setSidebarOpen(false)}
          />
        </Transition.Child>

        <div className="fixed inset-0 flex z-40">
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
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              {sidebarOpen && <AppSidebar />}
            </Dialog.Panel>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
