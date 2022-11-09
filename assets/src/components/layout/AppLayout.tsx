import { format } from 'date-fns'
import { RenderableProps } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import uniqolor from 'uniqolor'

import CalendarRail from '@/components/calendar/CalendarRail'
import TaskContextMenu from '@/components/menus/TaskContextMenu'
import DeleteTaskModal from '@/components/modals/DeleteTaskModal'
import OnboardingModal from '@/components/modals/OnboardingModal'
import QuickFindModal from '@/components/modals/QuickFindModal'
import ShorctutsModal from '@/components/modals/ShorctutsModal'
import AppSidebar from '@/components/nav/AppSidebar'
import { SidebarMenu } from '@/components/nav/SidebarMenu'
import useSwipe from '@/hooks/useSwipe'
import { uiStore } from '@/stores/uiStore'
import { classNames, ctrlOrCommand } from '@/utils'
import { useStore } from '@nanostores/preact'

import AppHeader from './AppHeader'

export default function ({ children }: RenderableProps<{}>) {
  const sidebarMenuOpen = useStore(uiStore.sidebarMenuOpen)
  const sidebarHidden = useStore(uiStore.sidebarHidden)

  const setSidebarOpen = (state: boolean) => uiStore.sidebarMenuOpen.set(state)

  useEffect(() => {
    if (sidebarMenuOpen) {
      const unsub = uiStore.path.listen(() => {
        setSidebarOpen(false)
      })
      return unsub
    }
  }, [sidebarMenuOpen])

  useSwipe((dir) => {
    setSidebarOpen(dir == 'right')
  })

  // generate two random colors from today's date
  const date = useStore(uiStore.calendarDate)
  const gradientColor1 = uniqolor(format(date, 'd MMMM EEEE'), { lightness: [85, 97] }).color
  const gradientColor2 = uniqolor(format(date, 'EEEE M<MM d'), { lightness: [85, 97] }).color

  const style = {
    background: `linear-gradient(320deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`,
  }

  return (
    <div class="w-full h-full" style={style}>
      <SidebarMenu />
      {!sidebarHidden && (
        <div className="hidden md:flex md:w-52 md:flex-col md:fixed md:inset-y-0 relative">
          <AppSidebar showHideButton />
        </div>
      )}

      <div
        className={classNames(
          !sidebarHidden ? 'md:ml-52' : '',
          'flex flex-col min-h-full print:h-auto bg-white'
        )}
      >
        <div className="flex-1 flex">
          <main className="flex flex-1 flex-col mt-1">{children}</main>
          <CalendarRail />
        </div>

        <TaskContextMenu />
        <DeleteTaskModal />
        <QuickFindModal />
        <OnboardingModal />
        <ShorctutsModal />
      </div>
    </div>
  )
}

export type SidebarProps = {
  sidebarOpen: boolean
  desktopSidebarHidden: boolean
  setDesktopSidebarHidden: (s: boolean) => void
  setSidebarOpen: (s: boolean) => void
}
