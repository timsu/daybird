import { Fragment } from 'preact'

import Alphatar from '@/components/core/Alphatar'
import Avatar from '@/components/core/Avatar'
import { paths } from '@/config'
import { authStore } from '@/stores/authStore'
import { uiStore } from '@/stores/uiStore'
import { classNames } from '@/utils'
import { Menu, Transition } from '@headlessui/react'
import { useStore } from '@nanostores/preact'

const userNavigation = [
  {
    name: 'Toggle Focus Mode',
    href: '#',
    onClick: () => {
      const setting = !uiStore.sidebarHidden.get()
      uiStore.sidebarHidden.set(setting)
      uiStore.calendarOpen.set(!setting)
    },
  },
  { name: 'User Settings', href: paths.SETTINGS },
  uiStore.isPWA
    ? null
    : { name: 'Install Daybird App', href: '#', onClick: () => uiStore.installAction() },
  { name: 'Report a Bug', href: 'mailto:tim@daybird.app?subject=Bug Report' },
  { name: 'Sign out', href: '#', onClick: () => authStore.logout() },
]

export default () => {
  const user = useStore(authStore.loggedInUser)

  if (!user) return null

  return (
    <Menu as="div" className="ml-3 relative">
      <div>
        <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
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
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item key="user">
            <div class={'block px-4 py-2 text-sm text-gray-700 border-b border-gray-200'}>
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
                      'block px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    {item.name}
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
