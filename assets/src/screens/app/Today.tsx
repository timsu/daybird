import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import { paths } from '@/config'
import shareIcon from '@/images/share-apple.svg'
import { projectStore } from '@/stores/projectStore'
import { getOS, isMobile } from '@/utils/os'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const hasProjects = useStore(projectStore.projects).length > 0
  const isPWA = location.search?.includes('source=pwa')

  return (
    <div className="py-6">
      <Helmet title="ListNote | Today" />

      <div className="px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Today</h1>
      </div>
    </div>
  )
}
