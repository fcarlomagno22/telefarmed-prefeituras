export type CalendarEventAlarm = {
  relativeOffset: number
}

export type CreateCalendarEventInput = {
  title: string
  startDate: Date
  endDate: Date
  notes?: string
  location?: string
  timeZone?: string
  alarms?: CalendarEventAlarm[]
}
