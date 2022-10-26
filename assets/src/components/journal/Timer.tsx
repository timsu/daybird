import { Fragment } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Tooltip from '@/components/core/Tooltip'
import TimerModal from '@/components/journal/TimerModal'
import { classNames, timeToString } from '@/utils'
import { PauseIcon, PlayIcon, RefreshIcon, XIcon } from '@heroicons/react/outline'

type TimerState = {
  timerStart: number
  duration: number
  original: number
}

export default function () {
  const [open, setOpen] = useState<boolean>(false)
  const [timerState, setTimerState] = useState<TimerState | null>(null)

  const startTimer = (duration: number) => {
    setTimerState({ timerStart: Date.now(), duration, original: duration })
  }

  if (timerState) {
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
        <div class={classNames('text-xl text-orange-600 w-16 text-center', done ? 'blink' : '')}>
          {paused ? (
            timeToString(timerState.duration)
          ) : (
            <TimeLeft state={timerState} onDone={onDone} />
          )}
        </div>
        <Button onClick={actionClick} class={'py-1 px-1 sm:px-4 ' + actionColor}>
          <ActionIcon class="w-5 h-5" />
        </Button>
        <Button
          onClick={() => setTimerState(null)}
          class="py-1 px-1 sm:px-4 bg-gray-600 hover:bg-gray-400"
        >
          <XIcon class="w-5 h-5" />
        </Button>
      </>
    )
  }

  return (
    <>
      <TimerModal open={open} close={() => setOpen(false)} performAction={startTimer} />
      <Tooltip message="Start a timer (e.g. pomodoro)" tooltipClass="w-[170px] text-center">
        <Button
          onClick={(e) => {
            !open && setOpen(true)
          }}
          class="py-1 px-1 sm:px-4"
        >
          Timer
        </Button>
      </Tooltip>
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
