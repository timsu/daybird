import { isBefore, startOfDay } from 'date-fns'
import { Fragment } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Pressable from '@/components/core/Pressable'
import { NODE_NAME } from '@/components/editor/TaskItem'
import { Task } from '@/models'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { classNames } from '@/utils'
import { Dialog, Transition } from '@headlessui/react'
import { useStore } from '@nanostores/preact'
import { JSONContent } from '@tiptap/react'

export default function ({ date }: { date: Date }) {
  const currentProject = useStore(projectStore.currentProject)
  const allTasks = useStore(taskStore.taskList)

  const [open, setOpen] = useState<HTMLElement | null>(null)
  const today = new Date()

  useEffect(() => {
    if (currentProject) taskStore.loadTasks(currentProject!)
  }, [currentProject?.id])

  if (isBefore(date, startOfDay(today))) return null

  if (allTasks.length == 0) return null

  return (
    <>
      <TasksMenu open={open} close={() => setTimeout(() => setOpen(null), 0)} />
      <Button
        onClick={(e) => {
          !open && setOpen(e.target as HTMLElement)
        }}
        class="ml-4 py-1 px-1 sm:px-4"
      >
        Insert Tasks
      </Button>
    </>
  )
}

function TasksMenu({ open, close }: { open: HTMLElement | null; close: () => void }) {
  const rect = open?.getBoundingClientRect()

  return (
    <Transition.Root show={!!open} as={Fragment}>
      <Dialog as="div" className="relative z-40 print:hidden" onClose={close}>
        <div class="block fixed" style={{ top: (rect?.bottom || 0) + 5, left: rect?.left }}>
          <div
            class={classNames(
              'bg-white w-[400px] max-h-[300px] overflow-hidden border border-gray-300 rounded-lg flex flex-col text-sm',
              'select-none text-gray-900 shadow-lg'
            )}
          >
            {!!open && <TaskMenuContent close={close} />}
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

function TaskMenuContent({ close }: { close: () => void }) {
  const allTasks = useStore(taskStore.taskList)

  useEffect(() => {
    // re-load task list when menu opens
    taskStore.loadTasks(projectStore.currentProject.get()!)
  }, [])

  const [displayedTasks, setDisplayedTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<{ [id: string]: boolean }>({})

  useEffect(() => {
    const tasksInDoc = new Set<string>()
    const doc = window.editor?.state.doc
    doc?.descendants((node, pos) => {
      if (node.type.name == NODE_NAME) {
        const id = node.attrs.id
        tasksInDoc.add(id)
      }
    })

    const tasks = allTasks.filter((t) => !t.completed_at && !t.archived_at && !tasksInDoc.has(t.id))
    setDisplayedTasks(tasks)
  }, [allTasks])

  const toggleAllSelected = () => {
    setSelectedTasks((selectedTasks) => {
      const selected = Object.values(selectedTasks).filter(Boolean)
      if (selected.length == displayedTasks.length) return {}
      else {
        displayedTasks.forEach((t) => (selectedTasks[t.id] = true))
        return { ...selectedTasks }
      }
    })
  }

  function insertTasks() {
    const tasks = displayedTasks.filter((t) => selectedTasks[t.id])

    const content = tasks
      .map(
        (t) =>
          ({
            type: 'task',
            attrs: { id: t.id, ref: true },
          } as JSONContent)
      )
      .concat([{ type: 'paragraph' }])
    window.editor?.commands.insertContent(content)
    close()
  }

  return (
    <>
      <div class="border-b p-2 flex gap-2 items-center">
        <button
          onClick={insertTasks}
          className="inline-flex px-4 py-2 shadow-sm text-sm rounded-md text-white bg-lavender-600 hover:bg-lavender-800"
        >
          Add Selected Tasks
        </button>

        <Pressable className="text-blue-500" onClick={toggleAllSelected}>
          Toggle All Selected
        </Pressable>
      </div>

      <div className="grid grid-cols-1 divide-y h-full overflow-scroll">
        {displayedTasks.map((t) => (
          <div
            key={t.id}
            className="flex p-3 cursor-pointer items-center hover:bg-gray-100"
            onClick={() => setSelectedTasks((s) => ({ ...s, [t.id]: !s[t.id] }))}
          >
            <input type="checkbox" className="rounded mr-2" checked={selectedTasks[t.id]} />
            {t.title}
          </div>
        ))}
      </div>
    </>
  )
}
