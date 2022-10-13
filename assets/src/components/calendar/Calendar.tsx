import {
    addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth,
    startOfWeek, subMonths
} from 'date-fns'
import { useState } from 'preact/hooks'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'

// from https://medium.com/@jain.jenil007/building-a-calendar-in-react-2c53b6ca3e96
const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeDate, setActiveDate] = useState(new Date())

  const getHeader = () => {
    return (
      <div class="flex items-center mb-1">
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
      week.push(
        <div
          className={`p-1 text-center rounded-full cursor-pointer ${
            isSameMonth(currentDate, activeDate) ? '' : 'text-gray-400'
          } ${isSameDay(currentDate, selectedDate) ? 'bg-blue-500 text-white' : ''}
          ${isSameDay(currentDate, new Date()) ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setSelectedDate(cloneDate)
          }}
        >
          {format(currentDate, 'd')}
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
    <div class="calendar text-xs p-2">
      {getHeader()}
      {getWeekDaysNames()}
      {getDates()}
    </div>
  )
}

export default Calendar
