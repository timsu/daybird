import { useEffect, useState } from 'preact/hooks'

import CalendarToggle from '@/components/calendar/CalendarToggle'
import UserMenu from '@/components/nav/UserMenu'
import ProjectPills from '@/components/projects/ProjectPills'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'
import { ChevronLeftIcon, MenuAlt2Icon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

import { SidebarProps } from './AppLayout'

export default function AppHeader(p: SidebarProps) {
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
        'sticky top-0 py-1 z-20 flex-shrink-0 flex min-h-[40px]',
        'print:hidden bg-white border-b',
        hasShadow ? '' : 'border-transparent'
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
        <CalendarToggle />
        <UserMenu />
      </div>
    </div>
  )
}
