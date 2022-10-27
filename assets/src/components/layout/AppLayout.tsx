import { RenderableProps } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import CalendarRail from '@/components/calendar/CalendarRail'
import TaskContextMenu from '@/components/menus/TaskContextMenu'
import DeleteTaskModal from '@/components/modals/DeleteTaskModal'
import OnboardingModal from '@/components/modals/OnboardingModal'
import QuickFindModal from '@/components/modals/QuickFindModal'
import AppSidebar from '@/components/nav/AppSidebar'
import { SidebarMenu } from '@/components/nav/SidebarMenu'
import useSwipe from '@/hooks/useSwipe'
import { uiStore } from '@/stores/uiStore'
import { classNames, ctrlOrCommand } from '@/utils'
import { useStore } from '@nanostores/preact'

import AppHeader from './AppHeader'

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
        <AppHeader {...props} />

        <div className="flex-1 flex">
          <main className="flex flex-1 flex-col mt-1 px-6">{children}</main>
          <CalendarRail />
        </div>

        <TaskContextMenu />
        <DeleteTaskModal />
        <QuickFindModal />
        <OnboardingModal />
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
