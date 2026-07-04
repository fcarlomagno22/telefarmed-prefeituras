import { Linking } from 'react-native'
import type { CreateCalendarEventInput } from './calendar.types'

function formatGoogleCalendarDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

export async function openCalendarEventUrl(input: CreateCalendarEventInput): Promise<void> {
  const dates = `${formatGoogleCalendarDate(input.startDate)}/${formatGoogleCalendarDate(input.endDate)}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates,
  })

  if (input.notes) {
    params.set('details', input.notes)
  }

  if (input.location) {
    params.set('location', input.location)
  }

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`
  await Linking.openURL(url)
}
