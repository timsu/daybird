declare module '@event-calendar/core' {
  export type EventClickInfo = {
    el: HTMLElement
    event: CalEvent
    jsEvent: MouseEvent
    view: CalView
  }

  export type Options = {
    view: string
    events: CalEvent[]
    nowIndicator?: boolean
    scrollTime?: string
    date?: Date
    slotHeight?: number
    eventClick?: (info: EventClickInfo) => void
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

  export type CalView = {
    type: string
    title: string
    currentStart: Date
    currentEnd: Date
    activeStart: Date
    activeEnd: Date
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
