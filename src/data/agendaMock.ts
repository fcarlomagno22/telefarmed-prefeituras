import {
  addDays,
  formatAgendaDayLabel,
  toDateKey,
} from '../utils/agendaDate'
import {
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  generateAgendaDayAppointments,
} from '../utils/agenda/agendaDaySlots'

export type AppointmentStatus =
  | 'realizado'
  | 'em_atendimento'
  | 'aguardando'
  | 'agendado'
  | 'faltou'

export type DayAppointment = {
  id: string
  time: string
  patientName: string
  patientCpf: string
  patientPhone: string
  serviceType: string
  status: AppointmentStatus
}

export type AgendaHistoryDay = {
  id: string
  weekdayLabel: string
  total: number
  completed: number
  noShows: number
}

export type AgendaDaySummary = {
  total: number
  completed: number
  inProgress: number
  waiting: number
  scheduled: number
  noShows: number
  attendanceRate: number
}

export type AgendaHourlySlot = {
  hour: string
  count: number
  isPeak: boolean
}

export type AgendaOperationalClimate = {
  hourlySlots: AgendaHourlySlot[]
}

export type AgendaDayData = {
  appointments: DayAppointment[]
  summary: AgendaDaySummary
  operationalClimate: AgendaOperationalClimate
}

/** Data de referência "hoje" no ambiente de demonstração. */
export const agendaToday = new Date(2026, 4, 19)

/** @deprecated Use `agendaToday`. */
export const agendaReferenceDate = agendaToday

const CLIMATE_HOURS = Array.from(
  { length: AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR + 1 },
  (_, index) => `${String(AGENDA_DAY_START_HOUR + index).padStart(2, '0')}h`,
)

function dayOffsetFromToday(date: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const todayStart = new Date(
    agendaToday.getFullYear(),
    agendaToday.getMonth(),
    agendaToday.getDate(),
  ).getTime()
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime()
  return Math.round((dateStart - todayStart) / msPerDay)
}

function appointmentsForDate(date: Date): DayAppointment[] {
  const dateKey = toDateKey(date)
  return generateAgendaDayAppointments(dateKey, dayOffsetFromToday(date))
}

const appointmentsMay19 = appointmentsForDate(new Date(2026, 4, 19))
const appointmentsMay18 = appointmentsForDate(new Date(2026, 4, 18))
const appointmentsMay17 = appointmentsForDate(new Date(2026, 4, 17))
const appointmentsMay16 = appointmentsForDate(new Date(2026, 4, 16))
const appointmentsMay15 = appointmentsForDate(new Date(2026, 4, 15))
const appointmentsMay14 = appointmentsForDate(new Date(2026, 4, 14))
const appointmentsMay20 = appointmentsForDate(new Date(2026, 4, 20))

export function buildAgendaDaySummary(appointments: DayAppointment[]): AgendaDaySummary {
  const completed = appointments.filter((item) => item.status === 'realizado').length
  const inProgress = appointments.filter((item) => item.status === 'em_atendimento').length
  const waiting = appointments.filter((item) => item.status === 'aguardando').length
  const scheduled = appointments.filter((item) => item.status === 'agendado').length
  const noShows = appointments.filter((item) => item.status === 'faltou').length
  const total = appointments.length
  const attendanceRate =
    total > 0 ? Math.round(((completed + inProgress) / total) * 100) : 0

  return {
    total,
    completed,
    inProgress,
    waiting,
    scheduled,
    noShows,
    attendanceRate,
  }
}

export function buildAgendaOperationalClimate(
  appointments: DayAppointment[],
): AgendaOperationalClimate {
  const counts = new Map<string, number>()

  for (const appointment of appointments) {
    const hour = `${appointment.time.split(':')[0]}h`
    counts.set(hour, (counts.get(hour) ?? 0) + 1)
  }

  const slots = CLIMATE_HOURS.map((hour) => ({
    hour,
    count: counts.get(hour) ?? 0,
    isPeak: false,
  }))

  const maxCount = Math.max(...slots.map((slot) => slot.count), 0)

  return {
    hourlySlots: slots.map((slot) => ({
      ...slot,
      isPeak: slot.count > 0 && slot.count === maxCount,
    })),
  }
}

function createDayData(appointments: DayAppointment[]): AgendaDayData {
  return {
    appointments,
    summary: buildAgendaDaySummary(appointments),
    operationalClimate: buildAgendaOperationalClimate(appointments),
  }
}

const dayDataByKey: Record<string, AgendaDayData> = {
  [toDateKey(new Date(2026, 4, 19))]: createDayData(appointmentsMay19),
  [toDateKey(new Date(2026, 4, 18))]: createDayData(appointmentsMay18),
  [toDateKey(new Date(2026, 4, 17))]: createDayData(appointmentsMay17),
  [toDateKey(new Date(2026, 4, 16))]: createDayData(appointmentsMay16),
  [toDateKey(new Date(2026, 4, 15))]: createDayData(appointmentsMay15),
  [toDateKey(new Date(2026, 4, 14))]: createDayData(appointmentsMay14),
  [toDateKey(new Date(2026, 4, 20))]: createDayData(appointmentsMay20),
}

export function getAgendaDayData(date: Date): AgendaDayData {
  const key = toDateKey(date)
  return dayDataByKey[key] ?? createDayData(appointmentsForDate(date))
}

export function hasAgendaOnDate(date: Date): boolean {
  const data = dayDataByKey[toDateKey(date)]
  return Boolean(data && data.summary.total > 0)
}

export function getAgendaHistoryBefore(date: Date, count = 3): AgendaHistoryDay[] {
  return Array.from({ length: count }, (_, index) => {
    const historyDate = addDays(date, -(index + 1))
    const data = getAgendaDayData(historyDate)

    return {
      id: toDateKey(historyDate),
      weekdayLabel: formatAgendaDayLabel(historyDate),
      total: data.summary.total,
      completed: data.summary.completed,
      noShows: data.summary.noShows,
    }
  })
}

/** @deprecated Use `getAgendaDayData(agendaToday).appointments`. */
export const dayAppointments = appointmentsMay19

/** @deprecated Use `formatAgendaDayLabel(agendaToday)`. */
export const agendaDayLabel = formatAgendaDayLabel(agendaToday)

/** @deprecated Use `getAgendaHistoryBefore(agendaToday)`. */
export const agendaHistory = getAgendaHistoryBefore(agendaToday)

/** @deprecated Use `getAgendaDayData(agendaToday).summary`. */
export const agendaDaySummary = dayDataByKey[toDateKey(agendaToday)]!.summary

/** @deprecated Use `getAgendaDayData(agendaToday).operationalClimate`. */
export const agendaOperationalClimate = dayDataByKey[toDateKey(agendaToday)]!.operationalClimate
