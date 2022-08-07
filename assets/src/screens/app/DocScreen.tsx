import { CSSTransition } from 'preact-transitioning'

import Banner from '@/components/core/Banner'
import Button from '@/components/core/Button'
import Helmet from '@/components/core/Helmet'
import Tooltip from '@/components/core/Tooltip'
import Document from '@/components/editor/Document'
import { Project } from '@/models'
import { docStore } from '@/stores/docStore'
import { DOC_EXT, fileStore, getNameFromPath } from '@/stores/fileStore'
import { taskStore } from '@/stores/taskStore'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
  projectId?: string
  filename?: string
}

const LS_TASKS_INSERTED = 'dti:'

export default (props: Props) => {
  const docError = useStore(docStore.docError)

  const title = props.filename ? getNameFromPath(props.filename) : ''

  const isTodayJournal = title == fileStore.dailyFileTitle()
  const uncompleteTasksInserted =
    isTodayJournal && localStorage.getItem(LS_TASKS_INSERTED + props.projectId) == title

  const insertUncompleteTasks = async (e: MouseEvent) => {
    const tasks = await taskStore.loadTasks({ id: props.projectId! } as Project)
    const notInThisDoc = tasks.filter((t) => t.doc != props.path)
    const startIndex = 0

    // notInThisDoc.forEach((t, i) => {
    //   window.quill?.insertEmbed(
    //     startIndex + i,
    //     'seqtask',
    //     { id: t.id, ref: true },
    //     Quill.sources.USER
    //   )
    // })
    if (notInThisDoc.length) window.quill?.insertText(startIndex + notInThisDoc.length, '\n')
    localStorage.setItem(LS_TASKS_INSERTED + props.projectId, title)
    ;(e.target as HTMLDivElement).style.display = 'none'
  }

  return (
    <>
      <Helmet title={title} />
      <CSSTransition appear in={!!docError} classNames="fade" duration={500}>
        <div class="relative bg-red-500">
          <Banner onClose={() => docStore.docError.set(undefined)}>
            <p>{docError}</p>
          </Banner>
        </div>
      </CSSTransition>
      <div class="flex flex-col grow bg-white w-full">
        <div class="w-full max-w-2xl mx-auto pt-6 px-8 flex items-center">
          <h1 class="text-xl font-bold ">{title}</h1>
          {isTodayJournal && !uncompleteTasksInserted && (
            <Tooltip
              message="Adds all uncompleted tasks from this project to today's journal"
              placement="bottom"
            >
              <Button onClick={insertUncompleteTasks} class="ml-4 py-1">
                Insert Uncomplete Tasks
              </Button>
            </Tooltip>
          )}
        </div>
        <Document projectId={props.projectId} filename={props.filename} />
      </div>
    </>
  )
}
