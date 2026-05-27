import type { AppointmentStatus, DayAppointment } from '../../data/agendaMock'

export const AGENDA_DAY_START_HOUR = 7
export const AGENDA_DAY_END_HOUR = 19
export const AGENDA_SLOT_INTERVAL_MINUTES = 30

/** Horários de 07:00 a 19:00, a cada 30 minutos (inclusive). */
export function buildAgendaSlotTimes(
  startHour = AGENDA_DAY_START_HOUR,
  endHour = AGENDA_DAY_END_HOUR,
  intervalMinutes = AGENDA_SLOT_INTERVAL_MINUTES,
): string[] {
  const slots: string[] = []

  for (
    let minutes = startHour * 60;
    minutes <= endHour * 60;
    minutes += intervalMinutes
  ) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    slots.push(
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    )
  }

  return slots
}

const patientPool: Omit<DayAppointment, 'id' | 'time' | 'status'>[] = [
  {
    patientName: 'Maria Aparecida Silva',
    patientCpf: '412.789.123-45',
    patientPhone: '(11) 98765-4321',
    serviceType: 'Clínico geral',
  },
  {
    patientName: 'João Pedro Santos',
    patientCpf: '876.234.567-89',
    patientPhone: '(11) 97654-3210',
    serviceType: 'Pediatria',
  },
  {
    patientName: 'Ana Carolina Oliveira',
    patientCpf: '345.678.901-23',
    patientPhone: '(11) 96543-2109',
    serviceType: 'Cardiologia',
  },
  {
    patientName: 'Patricia Souza Lima',
    patientCpf: '901.234.567-89',
    patientPhone: '(11) 95432-1098',
    serviceType: 'Ginecologia',
  },
  {
    patientName: 'Fernanda Costa Ribeiro',
    patientCpf: '567.890.123-45',
    patientPhone: '(11) 94321-0987',
    serviceType: 'Psicologia',
  },
  {
    patientName: 'Marcos Antônio Ferreira',
    patientCpf: '234.567.890-12',
    patientPhone: '(11) 93210-9876',
    serviceType: 'Dermatologia',
  },
  {
    patientName: 'Luciana Martins Alves',
    patientCpf: '678.901.234-56',
    patientPhone: '(11) 92109-8765',
    serviceType: 'Geriatria',
  },
  {
    patientName: 'Roberto Carlos Mendes',
    patientCpf: '123.456.789-01',
    patientPhone: '(11) 91098-7654',
    serviceType: 'Ortopedia e Traumatologia',
  },
  {
    patientName: 'Carlos Alberto Souza',
    patientCpf: '456.789.012-34',
    patientPhone: '(11) 96543-2109',
    serviceType: 'Clínico geral',
  },
  {
    patientName: 'Ana Beatriz Lima',
    patientCpf: '567.890.123-45',
    patientPhone: '(11) 95432-1098',
    serviceType: 'Pediatria',
  },
  {
    patientName: 'Ricardo Almeida',
    patientCpf: '678.901.234-56',
    patientPhone: '(11) 94321-0987',
    serviceType: 'Cardiologia',
  },
  {
    patientName: 'Patrícia Oliveira',
    patientCpf: '789.012.345-67',
    patientPhone: '(11) 93210-9876',
    serviceType: 'Ginecologia',
  },
  {
    patientName: 'Fernanda Silva',
    patientCpf: '123.456.789-01',
    patientPhone: '(11) 98604-5105',
    serviceType: 'Psicologia',
  },
  {
    patientName: 'João Victor Mendes',
    patientCpf: '234.567.890-12',
    patientPhone: '(11) 98765-4321',
    serviceType: 'Dermatologia',
  },
  {
    patientName: 'Maria Eduarda Costa',
    patientCpf: '345.678.901-23',
    patientPhone: '(11) 97654-3210',
    serviceType: 'Clínico geral',
  },
]

function statusForTodaySlot(index: number): AppointmentStatus {
  if (index <= 7) return index === 5 ? 'faltou' : 'realizado'
  if (index === 8) return 'em_atendimento'
  if (index === 9) return 'aguardando'
  if (index === 10 || index === 11) return 'realizado'
  if (index === 14 || index === 18) return 'faltou'
  return 'agendado'
}

function statusForPastDaySlot(index: number, dayOffset: number): AppointmentStatus {
  if (index % 9 === 6) return 'faltou'
  if (dayOffset <= -2 && index > 20) return 'agendado'
  return 'realizado'
}

function statusForFutureDaySlot(index: number): AppointmentStatus {
  if (index % 13 === 4) return 'faltou'
  return 'agendado'
}

function resolveSlotStatus(dayOffsetFromToday: number, slotIndex: number): AppointmentStatus {
  if (dayOffsetFromToday === 0) return statusForTodaySlot(slotIndex)
  if (dayOffsetFromToday < 0) return statusForPastDaySlot(slotIndex, dayOffsetFromToday)
  return statusForFutureDaySlot(slotIndex)
}

/** Agenda completa do dia (um atendimento por slot de 30 min). */
export function generateAgendaDayAppointments(
  dateKey: string,
  dayOffsetFromToday: number,
): DayAppointment[] {
  const slots = buildAgendaSlotTimes()

  return slots.map((time, index) => {
    const patient = patientPool[(index + Math.abs(dayOffsetFromToday)) % patientPool.length]!

    return {
      id: `${dateKey}-${index}`,
      time,
      ...patient,
      status: resolveSlotStatus(dayOffsetFromToday, index),
    }
  })
}
