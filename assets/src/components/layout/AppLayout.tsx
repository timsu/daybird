import { Fragment, RenderableProps } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import AppSidebar from '@/components/layout/AppSidebar'
import UserMenu from '@/components/layout/UserMenu'
import TaskContextMenu from '@/components/menus/TaskContextMenu'
import DeleteTaskModal from '@/components/modals/DeleteTaskModal'
import QuickFindModal from '@/components/modals/QuickFindModal'
import { paths } from '@/config'
import useSwipe from '@/hooks/useSwipe'
import { modalStore } from '@/stores/modalStore'
import { uiStore } from '@/stores/uiStore'
import { classNames, ctrlOrCommand } from '@/utils'
import { isMobile } from '@/utils/os'
import { Dialog, Transition } from '@headlessui/react'
import { BellIcon, ChevronLeftIcon, MenuAlt2Icon, XIcon } from '@heroicons/react/outline'
import { SearchIcon } from '@heroicons/react/solid'
import { useStore } from '@nanostores/preact'

export default function ({ children }: RenderableProps<{}>) {
  const sidebarOpen = useStore(uiStore.sidebarOpen)
  const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(false)

  const setSidebarOpen = (state: boolean) => uiStore.sidebarOpen.set(state)

  useEffect(() => {
    if (sidebarOpen) {
      const unsub = uiStore.path.listen((newPath) => {
        if (!newPath.includes(paths.PROJECTS + '/')) setSidebarOpen(false)
      })
      return unsub
    }
  }, [sidebarOpen])

  useSwipe((dir) => {
    setSidebarOpen(dir == 'right')
  })

  return (
    <>
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
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
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
                      onTouchStart={() => setSidebarOpen(false)}
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

      {/* Static sidebar for desktop */}
      {!desktopSidebarHidden && (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 relative">
          <button
            type="button"
            className="absolute right-1 top-6 text-gray-400"
            onClick={() => setDesktopSidebarHidden(true)}
          >
            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <AppSidebar darkHeader />
        </div>
      )}
      <div className={classNames(!desktopSidebarHidden ? 'md:pl-64' : '', 'flex flex-col h-full')}>
        <div className="sticky top-0 z-20 flex-shrink-0 flex h-16 bg-white">
          {(!sidebarOpen || desktopSidebarHidden) && (
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              style={{ display: desktopSidebarHidden ? 'block' : undefined }}
              onClick={(e) =>
                desktopSidebarHidden ? setDesktopSidebarHidden(false) : setSidebarOpen(true)
              }
            >
              <span className="sr-only">Open sidebar</span>
              <MenuAlt2Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <form className="w-full flex md:ml-0" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">
                  Navigate
                </label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-500
                      focus:outline-none focus:placeholder-gray-400 focus:ring-0
                      focus:border-transparent sm:text-sm cursor-pointer flex items-center"
                    onClick={() => modalStore.quickFindModal.set(true)}
                  >
                    Navigate {!isMobile && `(${ctrlOrCommand()}+P)`}
                  </div>
                </div>
              </form>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button> */}

              <UserMenu />
            </div>
          </div>
        </div>

        <main className="flex flex-1 flex-col">{children}</main>

        <TaskContextMenu />
        <DeleteTaskModal />
        <QuickFindModal />
      </div>
    </>
  )
}
