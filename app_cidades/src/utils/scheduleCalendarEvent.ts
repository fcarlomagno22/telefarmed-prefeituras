import * as Calendar from 'expo-calendar'
import { Linking, Platform } from 'react-native'

const APPOINTMENT_DURATION_MINUTES = 20

export function parseScheduleTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

function buildAppointmentWindow(selectedDate: Date, time: string) {
  const start = parseScheduleTimeOnDate(selectedDate, time)
  const end = new Date(start.getTime() + APPOINTMENT_DURATION_MINUTES * 60 * 1000)
  return { start, end }
}

function formatGoogleCalendarDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

async function openGoogleCalendarUrl({
  title,
  start,
  end,
  notes,
}: {
  title: string
  start: Date
  end: Date
  notes: string
}) {
  const dates = `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(notes)}`
  await Linking.openURL(url)
}

export async function addScheduleAppointmentToDeviceCalendar({
  specialtyName,
  doctorName,
  selectedDate,
  selectedTime,
  patientName,
  ubtName,
  ubtAddress,
}: {
  specialtyName: string
  doctorName?: string
  selectedDate: Date
  selectedTime: string
  patientName?: string
  ubtName?: string
  ubtAddress?: string
}): Promise<void> {
  const { start, end } = buildAppointmentWindow(selectedDate, selectedTime)
  const title = `Consulta – ${specialtyName}`
  const notes = [
    ubtName ? `UBT: ${ubtName}` : null,
    ubtAddress ? `Endereço: ${ubtAddress}` : null,
    doctorName ? `Profissional: ${doctorName}` : null,
    patientName ? `Paciente: ${patientName}` : null,
    'Agendado via Telefarmed Cidades.',
  ]
    .filter(Boolean)
    .join('\n')

  if (Platform.OS === 'web') {
    await openGoogleCalendarUrl({ title, start, end, notes })
    return
  }

  const isCalendarAvailable = await Calendar.isAvailableAsync()
  if (!isCalendarAvailable) {
    await openGoogleCalendarUrl({ title, start, end, notes })
    return
  }

  try {
    await Calendar.createEventInCalendarAsync({
      title,
      startDate: start,
      endDate: end,
      notes,
      location: ubtAddress ?? ubtName ?? undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: [{ relativeOffset: -60 }, { relativeOffset: -15 }],
    })
  } catch {
    await openGoogleCalendarUrl({ title, start, end, notes })
  }
}
