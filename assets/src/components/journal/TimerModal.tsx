import { RenderableProps } from 'preact'
import { useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Checkbox from '@/components/core/Checkbox'
import Input from '@/components/core/Input'
import Modal from '@/components/modals/Modal'
import { Dialog } from '@headlessui/react'
import { ClockIcon } from '@heroicons/react/outline'

type Props = {
  open: boolean
  close: () => void
  performAction: (duration: number, fullscreen: boolean) => void
}

export default ({ open, close, performAction }: RenderableProps<Props>) => {
  const [duration, setDuration] = useState('25')
  const [fullscreen, setFullscreen] = useState(false)

  const quickDuration = (minutes: number) => {
    performAction(minutes * 60, fullscreen)
    close()
  }

  const submit = async (e: Event) => {
    e.preventDefault()

    performAction(parseFloat(duration) * 60, fullscreen)
    close()
  }

  return (
    <Modal open={!!open} close={close}>
      <form onSubmit={submit}>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <ClockIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            Start a Timer
          </Dialog.Title>
        </div>

        <div class="mt-3">
          <Input
            label="Duration (minutes)"
            type="number"
            value={duration}
            min={0}
            onChange={(e) => setDuration((e.target as HTMLInputElement).value)}
            className="text-3xl"
          />
        </div>

        <div className="mt-3 text-sm font-medium text-gray-700">Or choose a pre-set time:</div>

        <div class="flex justify-between gap-1 mt-1 mb-3">
          {[2, 5, 10, 15, 25, 60].map((d) => (
            <Button class="block flex-1 text-center" onClick={() => quickDuration(d)}>
              {d}
            </Button>
          ))}
        </div>

        <Checkbox checked={fullscreen} setChecked={setFullscreen} label="Start in fullscreen" />

        <div className="mt-3 sm:mt-6 flex justify-between">
          <Button class="bg-gray-500" onClick={close} onKeyPress={close}>
            Cancel
          </Button>
          <Button class="bg-blue-500 hover:bg-blue-800" onClick={submit}>
            Start
          </Button>
        </div>
      </form>
    </Modal>
  )
}
