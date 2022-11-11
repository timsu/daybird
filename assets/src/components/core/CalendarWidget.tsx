import {
    addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth,
    startOfWeek, subMonths
} from 'date-fns'
import { useEffect, useState } from 'preact/hooks'

import { classNames } from '@/utils'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'

type Props = {
  currentDate?: Date
  onSelect?: (date: Date) => void
  specialDaysFn?: (month: Date) => SpecialDays | undefined
}

type SpecialDays = {
  days: { [d: string]: boolean }
  class: string
}

// from https://medium.com/@jain.jenil007/building-a-calendar-in-react-2c53b6ca3e96
export default ({ currentDate, onSelect, specialDaysFn }: Props) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeDate, setActiveDate] = useState(new Date())

  const [specialDays, setSpecialDays] = useState<SpecialDays>()

  useEffect(() => {
    if (currentDate) setSelectedDate(currentDate)
  }, [currentDate])

  useEffect(() => {
    if (specialDaysFn) setSpecialDays(specialDaysFn(activeDate))
  }, [activeDate])

  const getHeader = () => {
    return (
      <div class="flex items-center mb-2">
        <ChevronLeftIcon
          className="rounded cursor-pointer h-4 w-4 text-gray-400 hover:bg-gray-200"
          onClick={() => setActiveDate(subMonths(activeDate, 1))}
        />
        <h2 className="text-sm flex-1 text-center">{format(activeDate, 'MMMM yyyy')}</h2>
        <ChevronRightIcon
          className="rounded cursor-pointer h-4 w-4 text-gray-400 hover:bg-gray-200"
          onClick={() => setActiveDate(addMonths(activeDate, 1))}
        />
      </div>
    )
  }

  const getWeekDaysNames = () => {
    const weekStartDate = startOfWeek(activeDate)
    const weekDays = []
    for (let day = 0; day < 7; day++) {
      weekDays.push(
        <div className="text-gray-400 my-1 text-center">
          {format(addDays(weekStartDate, day), 'E')}
        </div>
      )
    }
    return <div className="grid grid-cols-7">{weekDays}</div>
  }

  const generateDatesForCurrentWeek = (date: Date, selectedDate: Date, activeDate: Date) => {
    let currentDate = date
    const week = []
    for (let day = 0; day < 7; day++) {
      const cloneDate = currentDate

      const sameMonth = isSameMonth(currentDate, activeDate)
      const dayLabel = format(currentDate, 'd')
      const specialDay = sameMonth && specialDays?.days[dayLabel]

      week.push(
        <div
          className={classNames(
            'p-1 text-center cursor-pointer rounded-full',
            specialDay ? specialDays.class : '',
            sameMonth ? '' : 'text-gray-400',
            isSameDay(currentDate, selectedDate)
              ? 'bg-blue-200'
              : isSameDay(currentDate, new Date())
              ? 'bg-gray-200'
              : ''
          )}
          onClick={() => {
            setSelectedDate(cloneDate)
            onSelect?.(cloneDate)
          }}
        >
          {dayLabel}
        </div>
      )
      currentDate = addDays(currentDate, 1)
    }
    return <>{week}</>
  }

  const getDates = () => {
    const startOfTheSelectedMonth = startOfMonth(activeDate)
    const endOfTheSelectedMonth = endOfMonth(activeDate)
    const startDate = startOfWeek(startOfTheSelectedMonth)
    const endDate = endOfWeek(endOfTheSelectedMonth)

    let currentDate = startDate

    const allWeeks = []

    while (currentDate <= endDate) {
      allWeeks.push(generateDatesForCurrentWeek(currentDate, selectedDate, activeDate))
      currentDate = addDays(currentDate, 7)
    }

    return <div className="grid grid-cols-7">{allWeeks}</div>
  }

  return (
    <div class="calendar text-xs p-2 select-none">
      {getHeader()}
      {getWeekDaysNames()}
      {getDates()}
    </div>
  )
}
