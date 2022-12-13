import { RenderableProps } from 'preact'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { twMerge } from 'tailwind-merge'

import CalendarToggle from '@/components/calendar/CalendarToggle'
import UserMenu from '@/components/nav/UserMenu'
import ProjectPills from '@/components/projects/ProjectPills'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'
import { ChevronLeftIcon, MenuAlt2Icon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  transparent?: boolean
}

export default function AppHeader(p: RenderableProps<Props>) {
  const sidebarOpen = useStore(uiStore.sidebarMenuOpen)
  const sidebarHidden = useStore(uiStore.sidebarHidden)
  const prevPaths = useStore(uiStore.prevPaths)

  const [hasShadow, setHasShadow] = useState(false)

  useEffect(() => {
    const listener = () => {
      if (hasShadow && window.scrollY == 0) setHasShadow(false)
      else if (!hasShadow && window.scrollY > 0) setHasShadow(true)
    }
    window.addEventListener('scroll', listener)
    return () => window.removeEventListener('scroll', listener)
  }, [hasShadow])

  if (uiStore.reactNative) {
    return null
  }

  return (
    <div
      className={twMerge(
        'sticky top-0 py-1 z-20 flex-shrink-0 flex min-h-[40px]',
        'border-b max-w-[100vw]',
        p.transparent ? 'bg-transparent' : 'bg-white',
        hasShadow ? 'py-2' : 'border-transparent'
      )}
    >
      {(!sidebarOpen || sidebarHidden) && (
        <button
          type="button"
          className="px-4 border-gray-200 text-gray-500 focus:outline-none -my-1
        focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden hover:bg-gray-100"
          style={{ display: sidebarHidden ? 'block' : undefined }}
          onClick={(e) =>
            sidebarHidden ? uiStore.sidebarHidden.set(false) : uiStore.sidebarMenuOpen.set(true)
          }
        >
          <span className="sr-only">Open sidebar</span>
          <MenuAlt2Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
      {prevPaths.length > 0 ? (
        <button
          type="button"
          className="text-gray-400 ml-1 md:block hover:bg-gray-100 rounded-md"
          onClick={() => uiStore.goBack()}
          title="Previous Page"
        >
          <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : (
        <div class="w-8" />
      )}

      <div className="flex-1 sm:px-2 flex justify-between select-none pt-1 overflow-hidden">
        {p.children}
      </div>
      <div className="mr-4 flex items-center">
        <CalendarToggle />
        <UserMenu />
      </div>
    </div>
  )
}
