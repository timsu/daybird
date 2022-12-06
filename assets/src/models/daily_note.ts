import { endOfMonth, endOfWeek, endOfYear } from 'date-fns'

import { weekStartLocale } from '@/utils'

export enum Period {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class DailyNote {
  public id: string = ''

  public date: string = ''

  public type: Period = Period.DAY

  public snippet?: string | null

  public projectId?: string

  public static fromJSON(obj: Object, projectId: string): DailyNote {
    let item: DailyNote = Object.assign(new DailyNote(), obj)
    item.projectId = projectId

    return item
  }
}

const weekStart = weekStartLocale(navigator.language)
const weekStartsOn = weekStart == 'sat' ? 6 : weekStart == 'mon' ? 1 : 0

export function endOfDatePeriod(period: Period, date: Date) {
  switch (period) {
    case Period.WEEK:
      return endOfWeek(date, { weekStartsOn })
    case Period.MONTH:
      return endOfMonth(date)
    case Period.YEAR:
      return endOfYear(date)
  }
  return date
}
