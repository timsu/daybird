import { endOfMonth, endOfWeek, endOfYear } from 'date-fns'

import { weekStartLocale } from '@/utils'

export enum Period {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class Insight {
  public id: string = ''

  public date: string = ''

  public type: Period = Period.WEEK

  public snippet?: string | null

  public projectId?: string

  public static fromJSON(obj: Object, projectId: string): Insight {
    let item: Insight = Object.assign(new Insight(), obj)
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
