import { Fragment } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import Tooltip from '@/components/core/Tooltip'
import TimerModal from '@/components/journal/TimerModal'
import { timeToString } from '@/utils'
import { PauseIcon, PlayIcon, XIcon } from '@heroicons/react/outline'

type TimerState = {
  timerStart: number
  duration: number
}

export default function () {
  const [open, setOpen] = useState<boolean>(false)
  const [timerState, setTimerState] = useState<TimerState | null>(null)

  const startTimer = (duration: number) => {
    setTimerState({ timerStart: Date.now(), duration: 5 })
  }

  if (timerState) {
    const paused = !timerState.timerStart
    const onDone = () => {
      setTimerState({ duration: 0, timerStart: 0 })
      const audio = new Audio('/sounds/good.m4a')
      audio.play()
    }

    return (
      <>
        <div class="text-xl text-orange-600 w-16 text-center">
          {paused ? (
            timeToString(timerState.duration)
          ) : (
            <TimeLeft state={timerState} onDone={onDone} />
          )}
        </div>
        {timerState.duration > 0 && (
          <Button
            onClick={() =>
              setTimerState({
                duration: paused
                  ? timerState.duration
                  : timerState.duration - Math.floor((Date.now() - timerState.timerStart) / 1000),
                timerStart: paused ? Date.now() : 0,
              })
            }
            class={
              'py-1 px-1 sm:px-4 ' +
              (paused ? 'bg-blue-600 hover:bg-blue-400' : 'bg-orange-600 hover:bg-orange-400')
            }
          >
            {paused ? <PlayIcon class="w-5 h-5" /> : <PauseIcon class="w-5 h-5" />}
          </Button>
        )}
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
          class="py-1 px-1 sm:px-4 bg-orange-600 hover:bg-orange-400"
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
