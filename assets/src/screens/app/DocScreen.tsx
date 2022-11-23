import { CSSTransition } from 'preact-transitioning'
import { useCallback, useEffect } from 'preact/hooks'

import Banner from '@/components/core/Banner'
import Button from '@/components/core/Button'
import { triggerContextMenu } from '@/components/core/ContextMenu'
import Helmet from '@/components/core/Helmet'
import Pressable from '@/components/core/Pressable'
import Document from '@/components/editor/Document'
import Actions from '@/components/journal/Actions'
import AppHeader from '@/components/layout/AppHeader'
import DocMenu from '@/components/menus/DocMenu'
import { docStore } from '@/stores/docStore'
import { fileStore } from '@/stores/fileStore'
import { projectStore } from '@/stores/projectStore'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
  projectId?: string
  id?: string
}

const LS_TASKS_INSERTED = 'dti:'

export default (props: Props) => {
  const doc = useStore(docStore.doc)!
  const project = useStore(projectStore.projectMap)[props.projectId!]

  useEffect(() => {
    fileStore.onOpenDoc(props.id!)
  }, [props.id])

  return (
    <>
      <Helmet title={`${project?.name} | ${doc?.title || 'Loading'}`} />

      <AppHeader>
        <div class="flex items-center gap-4 overflow-hidden">
          <h1 class="text-xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
            {doc?.title}
          </h1>
          <Pressable
            onClick={(e) => {
              const pos = (e.target as HTMLDivElement).getBoundingClientRect()
              triggerContextMenu(pos.left, pos.top, 'doc-menu', {
                docId: props.id,
                projectId: props.projectId,
              })
            }}
          >
            <DotsHorizontalIcon className="h-4 w-4 text-gray-400" />
          </Pressable>
          <Actions />
        </div>
      </AppHeader>
      <DocMenu />

      <div class="flex flex-col grow w-full px-6">
        <Document projectId={props.projectId} id={props.id} />
      </div>
    </>
  )
}
