import { isBefore, startOfDay } from 'date-fns'
import { Fragment } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import { NODE_NAME } from '@/components/editor/LegacyTaskItem'
import { Task } from '@/models'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { classNames } from '@/utils'
import { Dialog, Transition } from '@headlessui/react'
import { useStore } from '@nanostores/preact'
import { JSONContent } from '@tiptap/react'

type Reflection = {
  content: string
  label?: string
}

const reflections: Reflection[] = [
  { label: "What's on your mind", content: `What's on your mind today?` },
  { label: "Today's top 3", content: `What three things do you absolutely need to do today?` },
  { label: 'About yesterday', content: `What went well yesterday? What could be better?` },
  { label: 'Gratitude', content: `What are three specific things you're grateful for?` },
  { label: 'What needs attention', content: `What needs your attention today?` },
  { label: 'What do you want to learn', content: `What do you want to learn today?` },
  {
    label: 'Eat the frog',
    content: `What's the hardest thing you need to do? How can you do that first?`,
  },
  {
    label: 'Long term goals',
    content: `What are your long-term goals? How can you advance them today?`,
  },
  { label: 'Loved ones', content: `What can you do for your loved ones to make today special?` },
  { label: 'Relaxing', content: `How can you slow down and relax today?` },
]

export default function ({ date }: { date: Date }) {
  const [open, setOpen] = useState<HTMLElement | null>(null)
  const today = new Date()

  if (isBefore(date, startOfDay(today))) return null

  return (
    <>
      <ReflectionMenu open={open} close={() => setOpen(null)} />
      <Tooltip message="Add a reflection prompt" tooltipClass="w-[170px] text-center">
        <Button
          onClick={(e) => {
            !open && setOpen(e.target as HTMLElement)
          }}
          class="ml-1 py-1 px-1 sm:px-4 bg-blue-600 hover:bg-blue-400"
        >
          Reflect
        </Button>
      </Tooltip>
    </>
  )
}

const MENU_WIDTH = 250

function ReflectionMenu({ open, close }: { open: HTMLElement | null; close: () => void }) {
  const rect = open?.getBoundingClientRect() || { bottom: 0, left: 0 }

  const targetLeft = rect.left + MENU_WIDTH > document.body.clientWidth ? 0 : rect.left

  return (
    <Transition.Root show={!!open} as={Fragment}>
      <Dialog as="div" className="relative z-40 print:hidden" onClose={close}>
        <div class="block fixed" style={{ top: (rect?.bottom || 0) + 5, left: targetLeft }}>
          <div
            class={classNames(
              `w-[${MENU_WIDTH}px] max-w-[${document.body.clientWidth}px]`,
              'bg-white max-h-[300px] overflow-hidden border border-gray-300 rounded-lg flex flex-col text-sm',
              'select-none text-gray-900 shadow-lg'
            )}
          >
            {!!open && <ReflectMenuContent close={close} />}
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

function ReflectMenuContent({ close }: { close: () => void }) {
  function insert(item: Reflection) {
    const content: JSONContent[] = [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: item.content,
            marks: [{ type: 'bold' }],
          },
        ],
      },
      { type: 'paragraph' },
      { type: 'paragraph' },
    ]

    close()
    setTimeout(() => window.editor?.chain().focus().insertContent(content).run(), 0)
  }

  return (
    <>
      <div className="grid grid-cols-1 divide-y h-full overflow-scroll">
        {reflections.map((r, i) => (
          <div
            key={i}
            className="flex p-3 cursor-pointer italic hover:bg-gray-100"
            onClick={() => insert(r)}
          >
            {r.label}
          </div>
        ))}
      </div>
    </>
  )
}
