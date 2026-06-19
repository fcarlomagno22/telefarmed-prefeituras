import type { AgendaDayData, AgendaHistoryDay, DayAppointment } from '../../../data/agendaMock'
import {
  agendaToday,
  buildAgendaDaySummary,
  buildAgendaOperationalClimate,
  getAgendaDayData,
  getAgendaHistoryBefore,
} from '../../../data/agendaMock'
import { getAgendaDoctorShifts } from '../../../data/agendaDoctorShiftMock'
import type { ScheduleTimeSlot } from '../../../data/scheduleDoctorsMock'
import {
  countSpecialtyAvailableSlotsOnDay,
  getDoctorAvailableSlots,
  getDoctorById,
  getDoctorScheduleOverview,
  getDoctorsForSpecialty,
  getDoctorsAvailableOnDay,
  scheduleDoctors,
} from '../../../data/scheduleDoctorsMock'
import { addDays, parseDateKey, toDateKey } from '../../../utils/agendaDate'
import { mockDelay } from '../delay'

export type UbtAgendaDoctorShiftApi = {
  doctorId: string
  doctorName: string
  specialtyName: string
  startTime: string
  endTime: string
}

export class UbtAgendaApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtAgendaApiError'
    this.status = status
    this.code = code
  }
}

export type DayAppointmentApi = DayAppointment & {
  pacienteId?: string
  profissionalId?: string | null
  especialidadeId?: string
  escalaSlotId?: string | null
}

const dayState = new Map<string, AgendaDayData>()
const appointmentDateById = new Map<string, string>()
let nextAppointmentId = 10000

function clone<T>(value: T): T {
  return structuredClone(value)
}

function ensureDay(dateKey: string): AgendaDayData {
  const cached = dayState.get(dateKey)
  if (cached) return cached
  const base = clone(getAgendaDayData(parseDateKey(dateKey)))
  dayState.set(dateKey, base)
  for (const item of base.appointments) {
    appointmentDateById.set(item.id, dateKey)
  }
  return base
}

function recalcDay(dateKey: string) {
  const day = ensureDay(dateKey)
  day.summary = buildAgendaDaySummary(day.appointments)
  day.operationalClimate = buildAgendaOperationalClimate(day.appointments)
}

function findAppointment(consultaId: string): { dateKey: string; day: AgendaDayData; index: number } {
  const directDateKey = appointmentDateById.get(consultaId)
  if (directDateKey) {
    const day = ensureDay(directDateKey)
    const index = day.appointments.findIndex((item) => item.id === consultaId)
    if (index >= 0) return { dateKey: directDateKey, day, index }
  }

  for (const [dateKey, day] of dayState.entries()) {
    const index = day.appointments.findIndex((item) => item.id === consultaId)
    if (index >= 0) return { dateKey, day, index }
  }
  throw new UbtAgendaApiError('Consulta nao encontrada.', 404, 'CONSULTA_NOT_FOUND')
}

function toDayAppointmentApi(item: DayAppointment, overrides?: Partial<DayAppointmentApi>): DayAppointmentApi {
  return {
    ...item,
    pacienteId: item.pacienteId ?? `pac-${item.id}`,
    profissionalId: null,
    especialidadeId: item.specialtyId ?? '4',
    escalaSlotId: null,
    ...overrides,
  }
}

export function isUbtAgendaApiError(error: unknown): error is UbtAgendaApiError {
  return error instanceof UbtAgendaApiError
}

export async function fetchUbtAgendaDay(_accessToken: string, date: string) {
  return mockDelay(clone(ensureDay(date)))
}

export async function fetchUbtAgendaWeek(_accessToken: string, from: string, to: string) {
  const start = parseDateKey(from)
  const end = parseDateKey(to)
  const week: Record<string, AgendaDayData> = {}

  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    const key = toDateKey(cursor)
    week[key] = clone(ensureDay(key))
  }

  return mockDelay(week)
}

export async function fetchUbtAgendaMonthIndicators(
  _accessToken: string,
  year: number,
  month: number,
) {
  const days: string[] = []
  for (let day = 1; day <= 31; day += 1) {
    const date = new Date(year, month - 1, day)
    if (date.getMonth() !== month - 1) break
    const key = toDateKey(date)
    if (ensureDay(key).summary.total > 0) days.push(key)
  }
  return mockDelay(new Set(days))
}

export async function fetchUbtAgendaHistory(
  _accessToken: string,
  date: string,
  count = 3,
) {
  const parsed = parseDateKey(date)
  const history: AgendaHistoryDay[] = getAgendaHistoryBefore(parsed, count).map((item) => ({ ...item }))
  return mockDelay(history)
}

export async function fetchUbtAgendaMedicos(
  _accessToken: string,
  params?: { specialtyId?: string; date?: string },
) {
  let doctors = params?.specialtyId ? getDoctorsForSpecialty(params.specialtyId) : scheduleDoctors
  if (params?.date && params.specialtyId) {
    doctors = getDoctorsAvailableOnDay(params.specialtyId, parseDateKey(params.date))
  }
  return mockDelay(clone(doctors))
}

export async function fetchUbtAgendaDoctorSlots(
  _accessToken: string,
  doctorId: string,
  date: string,
) {
  const slots: ScheduleTimeSlot[] = getDoctorAvailableSlots(doctorId, parseDateKey(date))
  return mockDelay(clone(slots))
}

export async function fetchUbtAgendaDoctorOverview(
  _accessToken: string,
  doctorId: string,
  from: string,
  days = 31,
) {
  const overview = getDoctorScheduleOverview(doctorId, parseDateKey(from), days).map((item) => ({
    date: toDateKey(item.date),
    worksThisDay: item.worksThisDay,
    availableSlots: item.availableSlots,
  }))
  return mockDelay(overview)
}

export async function fetchUbtAgendaSpecialtySlotCount(
  _accessToken: string,
  specialtyId: string,
  date: string,
) {
  return mockDelay(countSpecialtyAvailableSlotsOnDay(specialtyId, parseDateKey(date)))
}

export type UbtAgendaSpecialtyAvailability = {
  id: string
  name: string
  availableSlots: number
}

export async function fetchUbtAgendaSpecialtyAvailability(
  _accessToken: string,
  date: string,
) {
  const parsed = parseDateKey(date)
  const bySpecialty = new Map<string, UbtAgendaSpecialtyAvailability>()
  for (const doctor of scheduleDoctors) {
    if (!bySpecialty.has(doctor.specialtyId)) {
      bySpecialty.set(doctor.specialtyId, {
        id: doctor.specialtyId,
        name: doctor.specialtyName,
        availableSlots: countSpecialtyAvailableSlotsOnDay(doctor.specialtyId, parsed),
      })
    }
  }
  return mockDelay(Array.from(bySpecialty.values()))
}

export async function fetchUbtAgendaDoctorShifts(_accessToken: string, date: string) {
  const shifts = getAgendaDoctorShifts(parseDateKey(date)).map((item) => ({
    doctorId: item.id,
    doctorName: item.name,
    specialtyName: item.specialty,
    startTime: item.loginAt,
    endTime: item.logoutAt,
  }))
  return mockDelay(shifts)
}

export async function createUbtAgendaConsulta(
  _accessToken: string,
  payload: {
    pacienteId: string
    profissionalId: string
    especialidadeId: string
    data: string
    hora: string
    escalaSlotId?: string
    telefoneContato?: string
    observacoes?: string
    tipo?: 'consulta' | 'retorno'
  },
) {
  const day = ensureDay(payload.data)
  const doctor = getDoctorById(payload.profissionalId)
  const appointment: DayAppointmentApi = {
    id: `mock-agenda-${nextAppointmentId++}`,
    time: payload.hora,
    patientName: `Paciente ${payload.pacienteId}`,
    patientCpf: '000.000.000-00',
    patientPhone: payload.telefoneContato ?? '(11) 90000-0000',
    serviceType: doctor?.specialtyName ?? 'Consulta',
    specialtyId: payload.especialidadeId,
    status: 'agendado',
    pacienteId: payload.pacienteId,
    profissionalId: payload.profissionalId,
    especialidadeId: payload.especialidadeId,
    escalaSlotId: payload.escalaSlotId ?? null,
  }
  day.appointments.push(appointment)
  appointmentDateById.set(appointment.id, payload.data)
  recalcDay(payload.data)
  return mockDelay(clone(appointment))
}

export async function updateUbtAgendaConsulta(
  _accessToken: string,
  consultaId: string,
  payload: {
    profissionalId?: string
    especialidadeId?: string
    data?: string
    hora?: string
    telefoneContato?: string
    observacoes?: string
    status?: DayAppointment['status']
  },
) {
  const found = findAppointment(consultaId)
  const current = found.day.appointments[found.index]
  const targetDateKey = payload.data ?? found.dateKey

  if (targetDateKey !== found.dateKey) {
    found.day.appointments.splice(found.index, 1)
    recalcDay(found.dateKey)
    const targetDay = ensureDay(targetDateKey)
    const moved = toDayAppointmentApi(current, {
      time: payload.hora ?? current.time,
      status: payload.status ?? current.status,
      patientPhone: payload.telefoneContato ?? current.patientPhone,
      profissionalId: payload.profissionalId ?? null,
      especialidadeId: payload.especialidadeId ?? current.specialtyId,
      specialtyId: payload.especialidadeId ?? current.specialtyId,
    })
    targetDay.appointments.push(moved)
    appointmentDateById.set(moved.id, targetDateKey)
    recalcDay(targetDateKey)
    return mockDelay(clone(moved))
  }

  const updated = toDayAppointmentApi(current, {
    time: payload.hora ?? current.time,
    status: payload.status ?? current.status,
    patientPhone: payload.telefoneContato ?? current.patientPhone,
    profissionalId: payload.profissionalId ?? null,
    especialidadeId: payload.especialidadeId ?? current.specialtyId,
    specialtyId: payload.especialidadeId ?? current.specialtyId,
  })
  found.day.appointments[found.index] = updated
  recalcDay(found.dateKey)
  return mockDelay(clone(updated))
}

export async function cancelUbtAgendaConsulta(_accessToken: string, consultaId: string) {
  const found = findAppointment(consultaId)
  found.day.appointments[found.index] = {
    ...found.day.appointments[found.index],
    status: 'faltou',
  }
  recalcDay(found.dateKey)
  return mockDelay(undefined)
}

export async function confirmUbtAgendaRecepcao(_accessToken: string, consultaId: string) {
  const found = findAppointment(consultaId)
  const updated = toDayAppointmentApi(found.day.appointments[found.index], { status: 'aguardando' })
  found.day.appointments[found.index] = updated
  recalcDay(found.dateKey)
  return mockDelay(clone(updated))
}

export async function markUbtAgendaFalta(_accessToken: string, consultaId: string) {
  const found = findAppointment(consultaId)
  const updated = toDayAppointmentApi(found.day.appointments[found.index], { status: 'faltou' })
  found.day.appointments[found.index] = updated
  recalcDay(found.dateKey)
  return mockDelay(clone(updated))
}

export async function createUbtAgendaWalkIn(
  _accessToken: string,
  payload: {
    pacienteId: string
    especialidadeId: string
    profissionalId: string
    hora: string
    telefoneContato?: string
    observacoes?: string
  },
) {
  const dateKey = toDateKey(agendaToday)
  const day = ensureDay(dateKey)
  const doctor = getDoctorById(payload.profissionalId)
  const appointment: DayAppointmentApi = {
    id: `mock-agenda-${nextAppointmentId++}`,
    time: payload.hora,
    patientName: `Paciente ${payload.pacienteId}`,
    patientCpf: '000.000.000-00',
    patientPhone: payload.telefoneContato ?? '(11) 90000-0000',
    serviceType: doctor?.specialtyName ?? 'Consulta',
    specialtyId: payload.especialidadeId,
    status: 'aguardando',
    pacienteId: payload.pacienteId,
    profissionalId: payload.profissionalId,
    especialidadeId: payload.especialidadeId,
    escalaSlotId: null,
  }
  day.appointments.push(appointment)
  appointmentDateById.set(appointment.id, dateKey)
  recalcDay(dateKey)
  return mockDelay(clone(appointment))
}
