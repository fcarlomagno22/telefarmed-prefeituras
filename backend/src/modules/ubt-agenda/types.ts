import type { UbtScope } from '../ubt-pacientes/types.js'

export type { UbtScope }

export type AgendaConsultaStatusApi =
  | 'agendado'
  | 'aguardando'
  | 'em_atendimento'
  | 'realizado'
  | 'faltou'

export type DayAppointmentDto = {
  id: string
  time: string
  patientName: string
  patientCpf: string
  patientPhone: string
  serviceType: string
  specialtyId?: string
  status: AgendaConsultaStatusApi
  pacienteId?: string
  patientAvatarUrl?: string
  profissionalId?: string | null
  especialidadeId?: string
  escalaSlotId?: string | null
}

export type AgendaDaySummaryDto = {
  total: number
  completed: number
  inProgress: number
  waiting: number
  scheduled: number
  noShows: number
  attendanceRate: number
}

export type AgendaOperationalClimateDto = {
  hourlySlots: Array<{ hour: string; count: number; isPeak: boolean }>
}

export type AgendaDayDataDto = {
  appointments: DayAppointmentDto[]
  summary: AgendaDaySummaryDto
  operationalClimate: AgendaOperationalClimateDto
}

export type AgendaHistoryDayDto = {
  id: string
  weekdayLabel: string
  total: number
  completed: number
  noShows: number
}

export type ScheduleDoctorDto = {
  id: string
  name: string
  specialtyId: string
  specialtyName: string
  avatarUrl: string
  crm: string
  rating: number
  reviewCount: number
}

export type ScheduleTimeSlotDto = {
  time: string
  available: boolean
  bookedReason?: string
}

export type DoctorOverviewDayDto = {
  date: string
  worksThisDay: boolean
  availableSlots: number
}

export type SpecialtyAvailabilityDto = {
  id: string
  name: string
  availableSlots: number
}

export type DoctorShiftDto = {
  doctorId: string
  doctorName: string
  specialtyName: string
  startTime: string
  endTime: string
}

export type AgendaConsultaViewRow = {
  id: string
  entidade_contratante_id: string
  unidade_ubt_id: string
  paciente_id: string
  paciente_nome: string
  paciente_cpf: string
  paciente_telefone: string
  paciente_foto_url: string | null
  profissional_id: string | null
  profissional_nome: string | null
  escala_slot_id: string | null
  especialidade_id: string
  especialidade_nome: string
  tipo: string
  origem: string
  status: string
  data: string
  hora: string
  telefone_contato: string
  observacoes: string
}

export type EscalaSlotCatalogRow = {
  slotId: string
  data: string
  hora_inicio: string
  hora_fim: string
  especialidade_id: string
  especialidade_nome: string
  modalidade: string
  escopo_ubt: unknown
  profissional_id: string
  profissional_nome: string
}
