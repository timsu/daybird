import { Fragment } from 'preact'
import { StateUpdater, useEffect, useState } from 'preact/hooks'
import { twMerge } from 'tailwind-merge'

import Button from '@/components/core/Button'
import Pressable from '@/components/core/Pressable'
import Tooltip from '@/components/core/Tooltip'
import TimerModal from '@/components/journal/TimerModal'
import { uiStore } from '@/stores/uiStore'
import { classNames, timeToString } from '@/utils'
import { PauseIcon, PlayIcon, RefreshIcon, XIcon } from '@heroicons/react/outline'

type TimerState = {
  timerStart: number
  duration: number
  original: number
}

export default function ({ buttonClass }: { buttonClass: string }) {
  const [open, setOpen] = useState<boolean>(false)
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [fullscreen, setFullscreen] = useState<boolean>(false)

  const startTimer = (duration: number, fullscreen?: boolean) => {
    setTimerState({ timerStart: Date.now(), duration, original: duration })
    setFullscreen(Boolean(fullscreen))
  }

  const timerProps = { timerState, setTimerState, fullscreen, setFullscreen }

  if (timerState) {
    if (fullscreen) return <FullScreenTimer {...timerProps} />
    return (
      <div class="absolute sm:relative bg-white flex gap-2 left-0">
        <OngoingTimer {...timerProps} textClass="cursor-pointer" />
      </div>
    )
  }

  uiStore.startTimer = (e) => {
    !open && setOpen(true)
  }

  return (
    <>
      <TimerModal open={open} close={() => setOpen(false)} performAction={startTimer} />
      <Tooltip
        message="Start a timer (e.g. pomodoro)"
        tooltipClass="w-[170px] text-center"
        placement="right"
        class={buttonClass}
      >
        <Button onClick={uiStore.startTimer} class="py-1 px-1 sm:px-4">
          Timer
        </Button>
      </Tooltip>
    </>
  )
}

function FullScreenTimer(props: TimerProps) {
  return (
    <div
      class="fixed top-0 bottom-0 left-0 right-0 flex flex-col justify-center items-center
        bg-black/90 z-50"
    >
      <div class="flex flex-col items-center">
        <OngoingTimer {...props} textClass="text-[180px] my-10 w-auto" />
      </div>
      <div className="mt-20 text-white">
        <Pressable onClick={() => props.setFullscreen(false)}>close</Pressable>
      </div>
    </div>
  )
}

type TimerProps = {
  textClass?: string
  timerState: TimerState | null
  setTimerState: StateUpdater<TimerState | null>
  fullscreen: boolean
  setFullscreen: StateUpdater<boolean>
}

function OngoingTimer({ timerState, setTimerState, setFullscreen, textClass }: TimerProps) {
  if (!timerState) return null
  const paused = !timerState.timerStart
  const done = !timerState.duration

  const onDone = () => {
    setTimerState({ duration: 0, timerStart: 0, original: timerState.original })
    const audio = new Audio('/sounds/good.m4a')
    audio.play()
  }

  const ActionIcon = done ? RefreshIcon : paused ? PlayIcon : PauseIcon
  const actionColor =
    paused || done ? 'bg-blue-600 hover:bg-blue-400' : 'bg-orange-600 hover:bg-orange-400'
  const actionClick = () => {
    setTimerState({
      duration: done
        ? timerState.original
        : paused
        ? timerState.duration
        : timerState.duration - Math.floor((Date.now() - timerState.timerStart) / 1000),
      timerStart: paused || done ? Date.now() : 0,
      original: timerState.original,
    })
  }

  return (
    <>
      <div
        class={twMerge(
          'text-xl text-orange-600 w-16 text-center font-mono',
          done ? 'blink' : '',
          textClass
        )}
        onClick={() => setFullscreen((s) => !s)}
      >
        {paused ? (
          timeToString(timerState.duration)
        ) : (
          <TimeLeft state={timerState} onDone={onDone} />
        )}
      </div>
      <div class="flex gap-1">
        <Button onClick={actionClick} class={'py-1 px-1 sm:px-4 ' + actionColor}>
          <ActionIcon class="w-5 h-5" />
        </Button>
        <Button
          onClick={() => setTimerState(null)}
          class="py-1 px-1 sm:px-4 bg-gray-600 hover:bg-gray-400"
        >
          <XIcon class="w-5 h-5" />
        </Button>
      </div>
    </>
  )
}

function TimeLeft({ state, onDone }: { state: TimerState; onDone: () => void }) {
  const [_time, setTime] = useState(0)
  useEffect(() => {
    const x = setInterval(() => {
      setTime(Date.now())
      if (Date.now() - state.timerStart > state.duration * 1000) onDone()
    }, 1000)

    return () => clearInterval(x)
  }, [])

  const seconds = state.duration - Math.floor((Date.now() - state.timerStart) / 1000)
  return <>{timeToString(seconds)}</>
}
