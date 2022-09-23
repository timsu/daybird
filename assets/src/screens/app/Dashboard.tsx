import { route } from 'preact-router'

import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import { config, paths } from '@/config'
import { projectStore } from '@/stores/projectStore'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}
export default (props: Props) => {
  const hasProjects = useStore(projectStore.projects).length > 0

  return (
    <div className="py-6">
      <Helmet title="ListNote | Dashboard" />

      <div className="px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {!hasProjects && (
        <div className="px-4 sm:px-6 md:px-8 my-6 bg-yellow-100 p-4 rounded">
          <p class="mb-2">Get started by creating your first project:</p>
          <a href={paths.PROJECTS}>
            <Button>Go to the projects page</Button>
          </a>
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 my-6 leading-10">
        <p class="mb-6">
          ListNote status: <b>Collaborative MVP</b> ({config.hash})
        </p>

        <p>Welcome to ListNote! </p>

        <p>
          I've moved all documents into the database. If you need the contents of your previous
          notes please let me know, they are still around.
        </p>

        <p>
          Please send ideas and feedback to{' '}
          <a class="hover:bg-blue-200 rounded text-blue-800" href="mailto:tim@listnote.co">
            tim@listnote.co
          </a>
          .
        </p>

        <p>Thank you for your support and patience.</p>

        <p>-Tim</p>
      </div>
    </div>
  )
}
