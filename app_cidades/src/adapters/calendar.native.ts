import * as Calendar from 'expo-calendar'
import type { CreateCalendarEventInput } from './calendar.types'

export async function isCalendarAvailableAsync(): Promise<boolean> {
  return Calendar.isAvailableAsync()
}

export async function createCalendarEventAsync(input: CreateCalendarEventInput): Promise<void> {
  await Calendar.createEventInCalendarAsync({
    title: input.title,
    startDate: input.startDate,
    endDate: input.endDate,
    notes: input.notes,
    location: input.location,
    timeZone: input.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    alarms: input.alarms,
  })
}
