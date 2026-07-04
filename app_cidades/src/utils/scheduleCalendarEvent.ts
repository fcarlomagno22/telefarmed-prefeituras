import { createCalendarEventAsync, isCalendarAvailableAsync } from '../adapters/calendar'
import { openCalendarEventUrl } from '../adapters/calendarUrl'

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

  const eventInput = {
    title,
    startDate: start,
    endDate: end,
    notes,
    location: ubtAddress ?? ubtName ?? undefined,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    alarms: [{ relativeOffset: -60 }, { relativeOffset: -15 }],
  }

  const isCalendarAvailable = await isCalendarAvailableAsync()
  if (!isCalendarAvailable) {
    await openCalendarEventUrl(eventInput)
    return
  }

  try {
    await createCalendarEventAsync(eventInput)
  } catch {
    await openCalendarEventUrl(eventInput)
  }
}
