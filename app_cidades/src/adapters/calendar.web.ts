import type { CreateCalendarEventInput } from './calendar.types'
import { openCalendarEventUrl } from './calendarUrl'

export async function isCalendarAvailableAsync(): Promise<boolean> {
  return false
}

export async function createCalendarEventAsync(input: CreateCalendarEventInput): Promise<void> {
  await openCalendarEventUrl(input)
}
