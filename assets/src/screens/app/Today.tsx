import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import Document from '@/components/editor/Document'
import DailyPrompt from '@/components/journal/DailyPrompt'
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
    // todo wait until files are loaded
    if (project) {
      if (!fileStore.fileTree.get()[project.id]) {
        const unsub = fileStore.fileTree.listen((value) => {
          if (!value[project.id]) return
          unsub()
          fileStore.newDailyFile(project).then(setTodayDoc)
        })
      } else {
        fileStore.newDailyFile(project).then(setTodayDoc)
      }
    }
  }, [project?.id])

  return (
    <div class="flex flex-col grow  w-full">
      <Helmet title="ListNote | Today" />

      <div className="max-w-2xl mx-auto w-full mt-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Today</h1>

        <DailyPrompt />
      </div>

      <DocMenu />
      {todayDoc && <Document projectId={project?.id} id={todayDoc} />}
    </div>
  )
}
