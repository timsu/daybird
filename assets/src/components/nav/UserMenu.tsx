import { Fragment } from 'preact'
import { route } from 'preact-router'

import Alphatar from '@/components/core/Alphatar'
import Avatar from '@/components/core/Avatar'
import { config, paths } from '@/config'
import useShortcut, { checkShortcut } from '@/hooks/useShortcut'
import { authStore } from '@/stores/authStore'
import { modalStore } from '@/stores/modalStore'
import { uiStore } from '@/stores/uiStore'
import { classNames, ctrlOrCommand } from '@/utils'
import { Menu, Transition } from '@headlessui/react'
import { useStore } from '@nanostores/preact'

const toggleFocusMode = () => {
  const setting = !uiStore.sidebarHidden.get()
  uiStore.sidebarHidden.set(setting)
  uiStore.calendarOpen.set(!setting)
  uiStore.manualCalendarOpen = !setting
}

export default () => {
  const user = useStore(authStore.loggedInUser)

  if (!user) return null

  const userNavigation = [
    {
      name: 'Toggle Focus Mode',
      shortcut: '\\',
      onClick: toggleFocusMode,
    },
    { name: 'User Settings', href: paths.SETTINGS },
    uiStore.insightLoop
      ? { name: 'Switch to Daybird', href: paths.TODAY }
      : { name: 'Try InsightLoop', href: paths.JOURNAL },
    uiStore.isPWA ? null : { name: 'Install Daybird App', onClick: () => uiStore.installAction() },
    {
      name: 'Keyboard Shortcuts',
      shortcut: '/',
      onClick: () => modalStore.shortcutsModal.set(true),
    },
    { name: 'Report a Bug', href: 'mailto:tim@daybird.app?subject=Bug Report' },
    config.dev && {
      name: '[dev] Onboarding',
      onClick: () => uiStore.checkForOnboarding(true),
    },
    { name: 'Sign out', onClick: () => authStore.logout() },
  ].filter(Boolean)

  useShortcut((e) => {
    if (checkShortcut(e, '\\')) {
      toggleFocusMode()
      return true
    } else if (checkShortcut(e, '/', '?')) {
      modalStore.shortcutsModal.set(true)
      return true
    } else if (checkShortcut(e, 'y')) {
      route(paths.TODAY)
    }
    return false
  }, [])

  return (
    <Menu as="div" className="ml-3 relative">
      <div>
        <Menu.Button
          className="max-w-xs bg-white flex items-center text-sm rounded-full
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="sr-only">Open user menu</span>
          <Alphatar id={user.id} text={user.name} />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item key="user">
            <div
              class={
                'block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 overflow-hidden text-ellipsis'
              }
            >
              {user.email}
            </div>
          </Menu.Item>
          {userNavigation.map((item) =>
            !item ? null : (
              <Menu.Item key={item.name}>
                {({ active }: { active: boolean }) => (
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className={classNames(
                      active ? 'bg-gray-100' : '',
                      'flex px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    {item.name}
                    {item.shortcut && (
                      <>
                        <div class="flex-1 min-w-[20px]" />
                        <div class="opacity-50">
                          {ctrlOrCommand()}+{item.shortcut}
                        </div>
                      </>
                    )}
                  </a>
                )}
              </Menu.Item>
            )
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
