import { Fragment } from 'preact'

import business_cat from '@/images/business-cat.jpg'
import { authStore } from '@/stores/authStore'
import { classNames } from '@/utils'
import { Menu, Transition } from '@headlessui/react'
import { useStore } from '@nanostores/preact'

const userNavigation = [
  // { name: 'Your Profile', href: '#' },
  // { name: 'Settings', href: '#' },
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
          <img className="h-8 w-8 rounded-full" src={business_cat} alt="" />
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
          {userNavigation.map((item) => (
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
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
