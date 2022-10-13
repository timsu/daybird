import { Fragment, RenderableProps } from 'preact'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

import TaskContextMenu from '@/components/menus/TaskContextMenu'
import DeleteTaskModal from '@/components/modals/DeleteTaskModal'
import QuickFindModal from '@/components/modals/QuickFindModal'
import AppSidebar from '@/components/nav/AppSidebar'
import UserMenu from '@/components/nav/UserMenu'
import ProjectPills from '@/components/projects/ProjectPills'
import { paths } from '@/config'
import useSwipe from '@/hooks/useSwipe'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
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

      {/* Static sidebar for desktop */}
      {!desktopSidebarHidden && (
        <div className="hidden md:flex md:w-52 md:flex-col md:fixed md:inset-y-0 relative">
          <AppSidebar darkHeader />
        </div>
      )}
      <div
        className={classNames(
          !desktopSidebarHidden ? 'md:ml-52' : '',
          'flex flex-col min-h-full print:h-auto bg-white px-6'
        )}
      >
        <Header {...props} />

        <main className="flex flex-1 flex-col mt-1">{children}</main>

        <TaskContextMenu />
        <DeleteTaskModal />
        <QuickFindModal />
      </div>
    </>
  )
}

type SidebarProps = {
  sidebarOpen: boolean
  desktopSidebarHidden: boolean
  setDesktopSidebarHidden: (s: boolean) => void
  setSidebarOpen: (s: boolean) => void
}

function Header(p: SidebarProps) {
  const { sidebarOpen, desktopSidebarHidden, setSidebarOpen, setDesktopSidebarHidden } = p
  const [hasShadow, setHasShadow] = useState(false)

  useEffect(() => {
    const listener = () => {
      if (hasShadow && window.scrollY == 0) setHasShadow(false)
      else if (!hasShadow && window.scrollY > 0) setHasShadow(true)
    }
    window.addEventListener('scroll', listener)
    return () => window.removeEventListener('scroll', listener)
  }, [hasShadow])

  return (
    <div
      className={classNames(
        'sticky top-0 py-1 z-20 flex-shrink-0 flex min-h-[40px] -mx-6',
        'print:hidden bg-white',
        hasShadow ? 'border-b' : ''
      )}
    >
      {(!sidebarOpen || desktopSidebarHidden) && (
        <button
          type="button"
          className="px-4 border-gray-200 text-gray-500 focus:outline-none -my-1
        focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden hover:bg-gray-100"
          style={{ display: desktopSidebarHidden ? 'block' : undefined }}
          onClick={(e) =>
            desktopSidebarHidden ? setDesktopSidebarHidden(false) : setSidebarOpen(true)
          }
        >
          <span className="sr-only">Open sidebar</span>
          <MenuAlt2Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
      {!desktopSidebarHidden && (
        <button
          type="button"
          className="text-gray-400 hidden md:block hover:bg-gray-100 rounded-md"
          onClick={() => setDesktopSidebarHidden(true)}
        >
          <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      <div className="flex-1 px-4 flex justify-between select-none overflow-x-scroll pt-1">
        <ProjectPills />
      </div>
      <div className="mr-4 flex items-center md:ml-6">
        <UserMenu />
      </div>
    </div>
  )
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
  )
}
