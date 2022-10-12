import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import Document from '@/components/editor/Document'
import DocMenu from '@/components/menus/DocMenu'
import { paths } from '@/config'
import shareIcon from '@/images/share-apple.svg'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { getOS, isMobile } from '@/utils/os'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
}

export default (props: Props) => {
  const project = useStore(projectStore.currentProject)
  const [todayDoc, setTodayDoc] = useState<string>('')

  useEffect(() => {
    if (project) fileStore.newDailyFile(project).then(setTodayDoc)
  }, [project?.id])

  return (
    <div class="flex flex-col grow  w-full">
      <Helmet title="ListNote | Today" />

      <div className="px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Today</h1>
      </div>

      <DocMenu />
      {todayDoc && <Document projectId={project?.id} id={todayDoc} />}
    </div>
  )
}
