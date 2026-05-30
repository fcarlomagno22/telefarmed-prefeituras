import type { AdminEscalaModality } from './adminEscala'

export type ProfissionalShiftRole = 'titular' | 'reserva'

export type ProfissionalShiftLifecycle =
  | 'aguardando_inicio'
  | 'em_andamento'
  | 'encerrado'

export type ProfissionalQueuePatientStatus =
  | 'aguardando'
  | 'chamado'
  | 'em_atendimento'
  | 'finalizado'
  | 'nao_compareceu'
  | 'desistiu'

export type ProfissionalAgendaNoticeType = 'troca' | 'cancelamento' | 'reserva'

export type ProfissionalShiftStats = {
  previstos: number
  naFila: number
  atendidos: number
  tempoMedioMin: number
}

export type ProfissionalShift = {
  id: string
  escalaShiftId: string
  dateKey: string
  municipality: string
  ubtLabel: string
  specialty: string
  turnLabel: string
  startAt: string
  endAt: string
  startTime: string
  endTime: string
  role: ProfissionalShiftRole
  modality: AdminEscalaModality
  modalityLabel: string
  lifecycle: ProfissionalShiftLifecycle
  stats: ProfissionalShiftStats
}

export type ProfissionalAgendaNotice = {
  id: string
  type: ProfissionalAgendaNoticeType
  title: string
  body: string
  dateLabel: string
  shiftDateKey?: string
}

export type ProfissionalQueuePatient = {
  id: string
  shiftId: string
  patientName: string
  patientAge: number
  patientCpf: string
  specialty: string
  serviceType: string
  triageReason: string
  ubtName: string
  scheduledTime?: string
  origin: 'agendado' | 'espontaneo'
  arrivedAt: string
  status: ProfissionalQueuePatientStatus
  recallCount: number
  calledAt?: string
  attendanceId?: string
}

export type ProfissionalEndShiftSummary = {
  atendidos: number
  naoCompareceu: number
  desistiu: number
  tempoMedioMin: number
  duracaoPlantaoMin: number
}

export type ProfissionalActiveShiftSession = {
  shiftId: string
  enteredAt: string
  endedAt?: string
  summary?: ProfissionalEndShiftSummary
}
