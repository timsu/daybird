import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import { paths } from '@/config'
import shareIcon from '@/images/share-apple.svg'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { getOS, isMobile } from '@/utils/os'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const hasProjects = useStore(projectStore.projects).length > 0
  const isPWA = location.search?.includes('source=pwa')
  uiStore.isPWA = isPWA

  return (
    <div className="py-6">
      <Helmet title="Dashboard" />

      <div className="px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {!isPWA && (
        <div className="bg-blue-200 p-4 mt-10 mb-8 mx-4 rounded">
          <div className="font-bold">
            Add Daybird to your {isMobile ? 'home screen' : 'desktop'}!
          </div>
          {getOS() == 'ios' ? (
            <div>
              Use the Share button in Safari{' '}
              <img src={shareIcon} width={26} height={26} className="inline align-middle" />
              to add Daybird to your Home Screen.
            </div>
          ) : (
            <div>
              Use the menu in your browser to
              {isMobile
                ? ' add Daybird to your home screen '
                : ' install Daybird as a desktop app '}
              and get quick access to your notes.
            </div>
          )}
        </div>
      )}

      {!hasProjects && (
        <div className="px-4 sm:px-6 md:px-8 my-6 bg-yellow-200 p-4 rounded">
          <p class="mb-2">Get started by creating your first project:</p>
          <a href={paths.PROJECTS}>
            <Button>Go to the projects page</Button>
          </a>
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 my-6 ">
        <p>Welcome to Daybird! It's a great day to start writing.</p>
        <div className="h-4" />
        <p>
          Daybird is beta software and is actively being developed. Please send ideas and feedback
          to{' '}
          <a class="hover:bg-blue-200 rounded text-blue-800" href="mailto:tim@daybird.app">
            tim@daybird.app
          </a>
          .
        </p>
        <div className="h-4" />
        <p>Thank you for your support and patience.</p>
        <div className="h-4" />

        <p>-Tim</p>
      </div>
    </div>
  )
}
