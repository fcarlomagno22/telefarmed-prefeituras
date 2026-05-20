import {
  addDays,
  formatAgendaDayLabel,
  toDateKey,
} from '../utils/agendaDate'

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

const CLIMATE_HOURS = ['08h', '09h', '10h', '11h', '12h', '14h'] as const

const appointmentsMay19: DayAppointment[] = [
  {
    id: '1',
    time: '08:00',
    patientName: 'Maria Aparecida Silva',
    patientCpf: '412.789.123-45',
    patientPhone: '(11) 98765-4321',
    serviceType: 'Clínico geral',
    status: 'realizado',
  },
  {
    id: '2',
    time: '08:40',
    patientName: 'João Pedro Santos',
    patientCpf: '876.234.567-89',
    patientPhone: '(11) 97654-3210',
    serviceType: 'Pediatria',
    status: 'realizado',
  },
  {
    id: '3',
    time: '09:20',
    patientName: 'Ana Carolina Oliveira',
    patientCpf: '345.678.901-23',
    patientPhone: '(11) 96543-2109',
    serviceType: 'Cardiologia',
    status: 'em_atendimento',
  },
  {
    id: '4',
    time: '10:00',
    patientName: 'Patricia Souza Lima',
    patientCpf: '901.234.567-89',
    patientPhone: '(11) 95432-1098',
    serviceType: 'Ginecologia',
    status: 'aguardando',
  },
  {
    id: '5',
    time: '10:40',
    patientName: 'Fernanda Costa Ribeiro',
    patientCpf: '567.890.123-45',
    patientPhone: '(11) 94321-0987',
    serviceType: 'Psicologia',
    status: 'agendado',
  },
  {
    id: '6',
    time: '11:20',
    patientName: 'Marcos Antônio Ferreira',
    patientCpf: '234.567.890-12',
    patientPhone: '(11) 93210-9876',
    serviceType: 'Dermatologia',
    status: 'faltou',
  },
  {
    id: '7',
    time: '14:00',
    patientName: 'Luciana Martins Alves',
    patientCpf: '678.901.234-56',
    patientPhone: '(11) 92109-8765',
    serviceType: 'Geriatria',
    status: 'agendado',
  },
  {
    id: '8',
    time: '14:40',
    patientName: 'Roberto Carlos Mendes',
    patientCpf: '123.456.789-01',
    patientPhone: '(11) 91098-7654',
    serviceType: 'Ortopedia e Traumatologia',
    status: 'agendado',
  },
]

const appointmentsMay18: DayAppointment[] = [
  {
    id: '18-1',
    time: '08:00',
    patientName: 'Carlos Alberto Souza',
    patientCpf: '456.789.012-34',
    patientPhone: '(11) 96543-2109',
    serviceType: 'Clínico geral',
    status: 'realizado',
  },
  {
    id: '18-2',
    time: '09:00',
    patientName: 'Ana Beatriz Lima',
    patientCpf: '567.890.123-45',
    patientPhone: '(11) 95432-1098',
    serviceType: 'Pediatria',
    status: 'realizado',
  },
  {
    id: '18-3',
    time: '10:00',
    patientName: 'Ricardo Almeida',
    patientCpf: '678.901.234-56',
    patientPhone: '(11) 94321-0987',
    serviceType: 'Cardiologia',
    status: 'realizado',
  },
  {
    id: '18-4',
    time: '11:00',
    patientName: 'Patrícia Oliveira',
    patientCpf: '789.012.345-67',
    patientPhone: '(11) 93210-9876',
    serviceType: 'Ginecologia',
    status: 'faltou',
  },
  {
    id: '18-5',
    time: '14:00',
    patientName: 'Fernanda Silva',
    patientCpf: '123.456.789-01',
    patientPhone: '(11) 98604-5105',
    serviceType: 'Psicologia',
    status: 'realizado',
  },
  {
    id: '18-6',
    time: '15:00',
    patientName: 'João Victor Mendes',
    patientCpf: '234.567.890-12',
    patientPhone: '(11) 98765-4321',
    serviceType: 'Dermatologia',
    status: 'realizado',
  },
]

const appointmentsMay17: DayAppointment[] = [
  {
    id: '17-1',
    time: '08:30',
    patientName: 'Maria Eduarda Costa',
    patientCpf: '345.678.901-23',
    patientPhone: '(11) 97654-3210',
    serviceType: 'Clínico geral',
    status: 'realizado',
  },
  {
    id: '17-2',
    time: '10:00',
    patientName: 'Marcos Antônio Ferreira',
    patientCpf: '234.567.890-12',
    patientPhone: '(11) 93210-9876',
    serviceType: 'Geriatria',
    status: 'realizado',
  },
  {
    id: '17-3',
    time: '11:00',
    patientName: 'Luciana Martins Alves',
    patientCpf: '678.901.234-56',
    patientPhone: '(11) 92109-8765',
    serviceType: 'Pediatria',
    status: 'faltou',
  },
  {
    id: '17-4',
    time: '14:30',
    patientName: 'Roberto Carlos Mendes',
    patientCpf: '123.456.789-01',
    patientPhone: '(11) 91098-7654',
    serviceType: 'Ortopedia e Traumatologia',
    status: 'realizado',
  },
]

const appointmentsMay16: DayAppointment[] = [
  {
    id: '16-1',
    time: '08:00',
    patientName: 'Maria Aparecida Silva',
    patientCpf: '412.789.123-45',
    patientPhone: '(11) 98765-4321',
    serviceType: 'Clínico geral',
    status: 'realizado',
  },
  {
    id: '16-2',
    time: '09:20',
    patientName: 'João Pedro Santos',
    patientCpf: '876.234.567-89',
    patientPhone: '(11) 97654-3210',
    serviceType: 'Pediatria',
    status: 'realizado',
  },
  {
    id: '16-3',
    time: '10:40',
    patientName: 'Ana Carolina Oliveira',
    patientCpf: '345.678.901-23',
    patientPhone: '(11) 96543-2109',
    serviceType: 'Cardiologia',
    status: 'realizado',
  },
  {
    id: '16-4',
    time: '11:20',
    patientName: 'Patricia Souza Lima',
    patientCpf: '901.234.567-89',
    patientPhone: '(11) 95432-1098',
    serviceType: 'Ginecologia',
    status: 'realizado',
  },
  {
    id: '16-5',
    time: '14:00',
    patientName: 'Fernanda Costa Ribeiro',
    patientCpf: '567.890.123-45',
    patientPhone: '(11) 94321-0987',
    serviceType: 'Psicologia',
    status: 'faltou',
  },
]

const appointmentsMay20: DayAppointment[] = [
  {
    id: '20-1',
    time: '08:00',
    patientName: 'Carlos Alberto Souza',
    patientCpf: '456.789.012-34',
    patientPhone: '(11) 96543-2109',
    serviceType: 'Clínico geral',
    status: 'agendado',
  },
  {
    id: '20-2',
    time: '08:40',
    patientName: 'Ana Beatriz Lima',
    patientCpf: '567.890.123-45',
    patientPhone: '(11) 95432-1098',
    serviceType: 'Pediatria',
    status: 'agendado',
  },
  {
    id: '20-3',
    time: '09:20',
    patientName: 'Ricardo Almeida',
    patientCpf: '678.901.234-56',
    patientPhone: '(11) 94321-0987',
    serviceType: 'Cardiologia',
    status: 'agendado',
  },
  {
    id: '20-4',
    time: '10:00',
    patientName: 'Patrícia Oliveira',
    patientCpf: '789.012.345-67',
    patientPhone: '(11) 93210-9876',
    serviceType: 'Ginecologia',
    status: 'agendado',
  },
  {
    id: '20-5',
    time: '10:40',
    patientName: 'Fernanda Silva',
    patientCpf: '123.456.789-01',
    patientPhone: '(11) 98604-5105',
    serviceType: 'Psicologia',
    status: 'agendado',
  },
  {
    id: '20-6',
    time: '11:20',
    patientName: 'João Victor Mendes',
    patientCpf: '234.567.890-12',
    patientPhone: '(11) 98765-4321',
    serviceType: 'Dermatologia',
    status: 'agendado',
  },
]

const appointmentsMay15: DayAppointment[] = [
  {
    id: '15-1',
    time: '09:00',
    patientName: 'Maria Eduarda Costa',
    patientCpf: '345.678.901-23',
    patientPhone: '(11) 97654-3210',
    serviceType: 'Clínico geral',
    status: 'realizado',
  },
  {
    id: '15-2',
    time: '14:00',
    patientName: 'Marcos Antônio Ferreira',
    patientCpf: '234.567.890-12',
    patientPhone: '(11) 93210-9876',
    serviceType: 'Geriatria',
    status: 'realizado',
  },
]

const appointmentsMay14: DayAppointment[] = [
  {
    id: '14-1',
    time: '10:00',
    patientName: 'Roberto Carlos Mendes',
    patientCpf: '123.456.789-01',
    patientPhone: '(11) 91098-7654',
    serviceType: 'Ortopedia e Traumatologia',
    status: 'realizado',
  },
]

function buildSummary(appointments: DayAppointment[]): AgendaDaySummary {
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

function buildOperationalClimate(appointments: DayAppointment[]): AgendaOperationalClimate {
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
    summary: buildSummary(appointments),
    operationalClimate: buildOperationalClimate(appointments),
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

const emptyDayData: AgendaDayData = createDayData([])

export function getAgendaDayData(date: Date): AgendaDayData {
  return dayDataByKey[toDateKey(date)] ?? emptyDayData
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
