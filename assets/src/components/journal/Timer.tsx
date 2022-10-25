import { Fragment } from 'preact'
import { useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Tooltip from '@/components/core/Tooltip'

export default function () {
  const [open, setOpen] = useState<HTMLElement | null>(null)

  return (
    <>
      <Tooltip message="Start a pomodoro timer" tooltipClass="w-[170px] text-center">
        <Button
          onClick={(e) => {
            !open && setOpen(e.target as HTMLElement)
          }}
          class="py-1 px-1 sm:px-4 bg-orange-600 hover:bg-orange-400"
        >
          Timer
        </Button>
      </Tooltip>
    </>
  )
}
