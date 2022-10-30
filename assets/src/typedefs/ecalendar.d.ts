declare module '@event-calendar/core' {
  export type Options = {
    view: string
    events: CalEvent[]
    nowIndicator?: boolean
    scrollTime?: string
    date?: Date
    slotHeight?: number
  }

  export type CalendarSettings = {
    target: HTMLElement
    props: {
      plugins: any[]
      options: Options
    }
  }

  export type CalEvent = {
    id: string
    allDay: boolean
    start: Date
    end: Date
    title: string
    backgroundColor: string
  }

  class Calendar {
    constructor(options: CalendarSettings)

    setOption(key: string, value: any)
  }

  export default Calendar
}

declare module '@event-calendar/time-grid' {
  class TimeGrid {}

  export default TimeGrid
}
